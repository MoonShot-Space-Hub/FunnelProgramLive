"""Compose an original background score and SFX for the reel, then mix it
under the voiceover.

Usage: python music.py <reel-dir>

Reads public/vo_master.wav and src/timeline.json and writes public/music.wav
(score + SFX, ducked under the voice); build_audio.sh mixes it with the voice. Everything
is synthesized here from oscillators and noise, so there is no third-party
audio and nothing to license.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 44100
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
END = 39.0  # video length in seconds
RNG = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def place(buf, clip, at, gain=1.0):
    """Add a mono or stereo clip into a stereo buffer at time `at`."""
    if clip.ndim == 1:
        clip = np.stack([clip, clip], axis=1)
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * gain


def lowpass(x, hz, order=2):
    sos = signal.butter(order, hz, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def highpass(x, hz, order=2):
    sos = signal.butter(order, hz, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def adsr(n, a, r, sustain_level=1.0):
    env = np.full(n, sustain_level)
    na, nr = int(a * SR), int(r * SR)
    if na:
        env[:na] = np.linspace(0, sustain_level, na)
    if nr:
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


def reverb(x, seconds=2.2, mix=0.3, tone=5000):
    """Convolution reverb with a synthetic, decorrelated stereo tail."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-t * 6.9 / seconds)
    ir = RNG.standard_normal((n, 2)) * decay[:, None]
    ir = lowpass(ir, tone)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix


# ---- instruments -----------------------------------------------------------

def pad(notes, dur, cutoff=1400, detune=0.08):
    """Warm detuned-saw pad, slow attack, wide stereo."""
    t = t_axis(dur)
    out = np.zeros((len(t), 2))
    for m in notes:
        for k, cents in enumerate((-detune * 100, 0, detune * 100)):
            f = midi(m) * 2 ** (cents / 1200)
            ph = RNG.random()
            saw = 2 * ((t * f + ph) % 1) - 1
            pan = (k - 1) * 0.6
            out[:, 0] += saw * (1 - pan) / 2
            out[:, 1] += saw * (1 + pan) / 2
    out = lowpass(out, cutoff, order=4)
    env = adsr(len(t), min(0.7, dur / 3), min(0.9, dur / 3))
    return out * env[:, None] / (len(notes) * 3)


def pluck(m, dur=0.9, bright=1.0):
    """Soft mallet/pluck: additive harmonics with faster decay up top."""
    t = t_axis(dur)
    f = midi(m)
    x = np.zeros_like(t)
    for h in range(1, 7):
        if f * h > 12000:
            break
        x += np.sin(2 * np.pi * f * h * t) * (bright / h ** 1.6) * np.exp(-t * (4 + 3.5 * h))
    x *= np.minimum(1, t / 0.004)
    return x


def sub(m, dur):
    t = t_axis(dur)
    x = np.tanh(1.6 * np.sin(2 * np.pi * midi(m) * t)) * 0.7
    return x * adsr(len(t), 0.02, 0.15)


def kick(level=1.0):
    t = t_axis(0.55)
    f = 46 + 120 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = highpass(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 400) * 0.25
    return np.tanh(1.4 * (x + click)) * level


def hat(level=1.0, decay=40):
    t = t_axis(0.12)
    x = highpass(RNG.standard_normal(len(t)), 7500, order=4) * np.exp(-t * decay)
    return x * level * 0.35


def snap(level=1.0):
    t = t_axis(0.35)
    noise = bandpass(RNG.standard_normal(len(t)), 900, 4500) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return (noise + body) * level * 0.45


def tick(pitch=2400, level=1.0):
    t = t_axis(0.06)
    x = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 140)
    x += highpass(RNG.standard_normal(len(t)), 5000) * np.exp(-t * 300) * 0.3
    return x * level


def crash(level=1.0, dur=2.6):
    t = t_axis(dur)
    x = highpass(RNG.standard_normal((len(t), 2)), 4500, order=2) * np.exp(-t * 2.2)[:, None]
    return x * level * 0.18


def riser(dur):
    """Filtered-noise swell plus a rising tone, ending on a hard cut."""
    t = t_axis(dur)
    n = len(t)
    noise = RNG.standard_normal((n, 2))
    out = np.zeros((n, 2))
    # sweep a band-pass up in short blocks
    block = 2048
    lo_hz = np.geomspace(250, 7000, n // block + 1)
    for b in range(n // block + 1):
        s = slice(b * block, min(n, (b + 1) * block + block))
        seg = noise[s]
        if len(seg) < 64:
            continue
        hz = lo_hz[b]
        filt = bandpass(seg, hz, min(hz * 2.2, 19000))
        w = np.hanning(len(seg))[:, None]
        out[s] += filt * w
    f = np.geomspace(110, 880, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    out += np.stack([tone, tone], axis=1)
    env = (t / dur) ** 2.2
    return out * env[:, None] * 0.6


def impact(level=1.0):
    t = t_axis(3.0)
    f = 62 * np.exp(-t * 0.9) + 28
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    thump = lowpass(RNG.standard_normal(len(t)), 900) * np.exp(-t * 14) * 0.9
    x = np.tanh(1.8 * (boom + thump)) * level
    return reverb(x, seconds=3.0, mix=0.35, tone=3000)


def whoosh(dur=0.55, level=1.0, up=True):
    t = t_axis(dur)
    n = len(t)
    noise = RNG.standard_normal((n, 2))
    hz = np.geomspace(400, 5000, n) if up else np.geomspace(5000, 400, n)
    out = np.zeros((n, 2))
    block = 1024
    for b in range(0, n, block):
        seg = noise[b:b + 2 * block]
        if len(seg) < 64:
            continue
        h = hz[min(b, n - 1)]
        out[b:b + len(seg)] += bandpass(seg, h * 0.6, min(h * 1.6, 19000)) * np.hanning(len(seg))[:, None]
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return out * env[:, None] * level * 0.5


# ---- arrangement -----------------------------------------------------------

def compose(timeline):
    lines = {l["id"]: l for l in timeline["lines"]}
    music = np.zeros((int(END * SR), 2))
    sfx = np.zeros_like(music)

    why = lines["why"]["start"]
    cut = why - 0.12           # music drops out just before "Why?"
    drop = lines["skill"]["start"] - 0.07  # and comes back in on "Trading is also a skill"

    # Section A: tense intro - dark drone, ticking clock, heartbeat kick
    drone = pad([45, 52, 57], cut + 0.4, cutoff=700, detune=0.05)
    drone += pad([33, 40], cut + 0.4, cutoff=300, detune=0.03) * 0.7
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.18 * t_axis(cut + 0.4))
    place(music, drone * lfo[:, None], 0, 0.9)
    beat_t = 0.0
    k = 0
    while beat_t < cut - 0.05:
        place(music, tick(2600 if k % 2 == 0 else 2000, 0.16), beat_t)
        if k % 4 == 0:
            place(music, kick(0.55), beat_t)
            place(music, kick(0.35), beat_t + BEAT * 0.45)
        beat_t += BEAT
        k += 1
    # build from "But people watch three YouTube videos"
    build_from = lines["youtube"]["start"] - 0.3
    place(music, riser(cut - build_from), build_from, 0.55)
    # 16th-note hats tightening during the build
    t16 = build_from
    while t16 < cut - 0.05:
        prog = (t16 - build_from) / (cut - build_from)
        place(music, hat(0.25 + 0.6 * prog, decay=60), t16)
        t16 += BEAT / 4
    # hard cut to silence, then the "Why?" impact
    fade = int(0.04 * SR)
    ci = int(cut * SR)
    music[ci - fade:ci] *= np.linspace(1, 0, fade)[:, None]
    music[ci:] = 0
    place(sfx, impact(0.9), why - 0.03, 0.8)

    # Section B: Am - F - C - G groove from "Trading is also a skill"
    prog = [
        (45, [57, 60, 64]),   # Am
        (41, [57, 60, 65]),   # F
        (48, [55, 60, 64]),   # C
        (43, [55, 59, 62]),   # G
    ]
    arps = {
        45: [69, 72, 76, 72, 81, 76, 72, 76],
        41: [69, 72, 77, 72, 81, 77, 72, 77],
        48: [67, 72, 76, 72, 79, 76, 72, 76],
        43: [67, 71, 74, 71, 79, 74, 71, 74],
    }
    bars = []
    t0 = drop
    while t0 < END:
        bars.append(t0)
        t0 += BAR
    n_bars = len(bars)
    cta = lines["cta1"]["start"]
    for b, start in enumerate(bars):
        last = b == n_bars - 1
        if last:
            root, chord = 48, [55, 60, 64, 67]  # resolve on C
        elif b == n_bars - 2:
            root, chord = 41, [57, 60, 65]      # F before the final C
        else:
            root, chord = prog[b % 4]
        span = END - start if last else BAR + 0.6
        energy = 0.6 if b < 2 else (0.8 if b < 4 else 1.0)
        place(music, pad(chord, span, cutoff=1100 + 500 * energy), start, 0.55)
        if start >= cta - 0.5:
            place(music, pad([c + 12 for c in chord], span, cutoff=2600), start, 0.18)
        place(music, sub(root - 12, min(span, BAR)), start, 0.22)
        if b == 0:
            place(music, crash(0.9), start)
        if last:
            place(music, kick(0.9), start)
            place(music, crash(0.7, dur=3.5), start)
            for i, m in enumerate(arps[45 if root == 45 else 48][:4]):
                place(music, pluck(m, 1.6), start + i * BEAT / 2, 0.22)
            continue
        for beat in range(4):
            bt = start + beat * BEAT
            if beat in (0, 2) or (energy >= 1.0):
                place(music, kick(0.75 if beat in (0, 2) else 0.45), bt)
            if energy >= 0.8 and beat in (1, 3):
                place(music, snap(0.55), bt)
            for e in range(2):
                place(music, hat(0.35 if e else 0.2, decay=45), bt + e * BEAT / 2)
        arp = arps[root]
        step = BEAT / 2
        for i in range(8):
            place(music, pluck(arp[i], 0.8), start + i * step, 0.16 + 0.05 * energy)
            if energy >= 1.0 and start >= cta - 0.5:
                place(music, pluck(arp[i] + 12, 0.6, bright=0.7), start + i * step + step / 2, 0.06)

    # SFX synced to the edit
    for key in ("plane", "youtube", "account", "overnight", "shortcut", "cta1"):
        place(sfx, whoosh(0.5, 0.5), lines[key]["start"] - 0.32)
    for key, m in (("education", 76), ("practice", 79), ("rules", 84)):
        place(sfx, pluck(m, 1.2, bright=1.3) + pluck(m + 7, 1.2, bright=0.6) * 0.5, lines[key]["start"], 0.38)
    place(sfx, whoosh(0.7, 0.6, up=True), lines["cta2"]["start"] - 0.4)

    music = highpass(reverb(music, seconds=2.4, mix=0.22), 38)
    # carve some room around the voice's presence range
    sos = signal.butter(2, [1500, 4000], "bandstop", fs=SR, output="sos")
    music = 0.6 * music + 0.4 * signal.sosfilt(sos, music, axis=0)
    sfx = highpass(reverb(sfx, seconds=1.4, mix=0.2), 38)
    return music, sfx


def duck(music, vo, depth_db=7.0):
    """Lower the music while the voice is talking (smoothed envelope)."""
    env = np.abs(vo)
    win = int(0.03 * SR)
    env = np.sqrt(np.convolve(env ** 2, np.ones(win) / win, mode="same"))
    env = np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
    # attack 25 ms, release 300 ms
    a, r = np.exp(-1 / (0.025 * SR)), np.exp(-1 / (0.3 * SR))
    sm = np.zeros_like(env)
    prev = 0.0
    for i, v in enumerate(env):
        coef = a if v > prev else r
        prev = coef * prev + (1 - coef) * v
        sm[i] = prev
    gain = 10 ** (-depth_db * sm / 20)
    return music * gain[:, None]


def main():
    reel = sys.argv[1]
    with open(os.path.join(reel, "src", "timeline.json")) as f:
        timeline = json.load(f)
    vo, vo_sr = sf.read(os.path.join(reel, "public", "vo_master.wav"))
    vo = signal.resample_poly(vo, SR, vo_sr)
    vo = np.pad(vo, (0, max(0, int(END * SR) - len(vo))))[: int(END * SR)]

    music, sfx = compose(timeline)
    music /= np.abs(music).max()
    sfx /= np.abs(sfx).max()
    bed = duck(music * 0.20, vo) + sfx * 0.22
    # gentle fade out at the end
    fo = int(1.2 * SR)
    bed[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2

    sf.write(os.path.join(reel, "public", "music.wav"), bed.astype(np.float32), SR)
    print("bars from", round(timeline["lines"][5]["start"], 2), "duration", END)


if __name__ == "__main__":
    main()
