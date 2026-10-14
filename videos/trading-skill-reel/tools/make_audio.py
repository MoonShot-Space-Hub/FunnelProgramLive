"""Synthesize an original background-music bed and the sound effects.

Everything is generated from scratch (oscillators + noise), so there is
no third-party copyright on any of it. Section changes follow the voice
timeline in src/data/timeline.json.

Usage: python tools/make_audio.py
Writes public/music.wav and public/sfx/*.wav
"""

import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)


def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "low", fs=SR, output="sos"), x)


def hp(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def adsr(n, a, d, s, r):
    env = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    env[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na)
    env[na : na + nd] = np.linspace(1, s, nd)
    if nr > 0 and nr < n:
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1) - 1


def reverb(x, seconds=2.2, mix=0.25):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = lp(ir, 6000)
    wet = fftconvolve(x, ir)[: len(x)]
    wet /= np.max(np.abs(wet)) + 1e-9
    return x * (1 - mix) + wet * mix * np.max(np.abs(x))


def place(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


# ---------------------------------------------------------------- instruments
def pad(notes, dur, bright=1800):
    t = t_arr(dur)
    out = np.zeros_like(t)
    for n in notes:
        f = midi(n)
        for det in (-0.12, -0.05, 0.0, 0.06, 0.13):
            out += saw(f * 2 ** (det / 12), t, rng.random())
    out = lp(out, bright, 2) / (len(notes) * 5)
    return out * adsr(len(t), 0.6, 0.4, 0.85, 0.7)


def pluck(n, dur=0.45, bright=3500):
    t = t_arr(dur)
    f = midi(n)
    sig = 0.6 * np.sign(np.sin(2 * np.pi * f * t)) + 0.4 * saw(f, t)
    sig = lp(sig, bright)
    return sig * np.exp(-t * 9)


def keys(n, dur=1.6):
    t = t_arr(dur)
    f = midi(n)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    sig += 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 5)
    return sig * np.exp(-t * 2.2) * adsr(len(t), 0.005, 0.1, 1, 0.2)


def sub(n, dur):
    t = t_arr(dur)
    sig = np.tanh(1.6 * np.sin(2 * np.pi * midi(n) * t))
    return sig * adsr(len(t), 0.01, 0.1, 0.8, 0.08)


def kick():
    t = t_arr(0.5)
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t * 7))


def hat(dur=0.06):
    t = t_arr(dur)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * 70)


def clap():
    t = t_arr(0.3)
    n = bp(rng.standard_normal(len(t)), 900, 3200)
    env = np.exp(-t * 18)
    for k in (0.0, 0.012, 0.024):
        env += np.where(t > k, np.exp(-(t - k) * 120), 0) * 0.6
    return n * env * 0.5


def tick():
    t = t_arr(0.03)
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 220)


# ---------------------------------------------------------------- sfx
def whoosh(dur=0.7, up=True):
    t = t_arr(dur)
    noise = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 24
    seg = len(t) // steps
    for k in range(steps):
        frac = k / steps if up else 1 - k / steps
        c = 300 + 5200 * frac**1.6
        chunk = bp(noise[k * seg : (k + 1) * seg + 400], c * 0.6, min(c * 1.6, 20000))
        place_seg = chunk[:seg]
        out[k * seg : k * seg + len(place_seg)] += place_seg
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return lp(out * env, 9000) * 1.4


def impact():
    t = t_arr(2.2)
    f = 32 + 80 * np.exp(-t * 14)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 30) * 0.35
    return reverb(np.tanh(1.8 * boom) + crack, 2.5, 0.35)


def riser(dur=1.1):
    t = t_arr(dur)
    noise = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    steps = 30
    seg = len(t) // steps
    for k in range(steps):
        c = 400 + 7000 * (k / steps) ** 2
        chunk = bp(noise[k * seg : (k + 1) * seg + 400], c * 0.7, min(c * 1.4, 20000))
        out[k * seg : k * seg + seg] += chunk[:seg]
    f = 200 + 900 * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (out * 0.8 + tone) * (t / dur) ** 2


def pop():
    t = t_arr(0.12)
    f = 900 - 500 * t / 0.12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)


def click():
    t = t_arr(0.05)
    return (hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120)) * 0.7


def beep():
    t = t_arr(0.16)
    return np.sin(2 * np.pi * 1046 * t) * adsr(len(t), 0.005, 0.02, 0.8, 0.04) * 0.5


def chime():
    out = np.zeros(int(2.0 * SR))
    for i, n in enumerate((84, 88, 91, 96)):
        place(out, keys(n, 1.6) * 0.5, i * 0.07)
    return reverb(out, 2.0, 0.4)


def glitch():
    t = t_arr(0.35)
    sig = np.sign(np.sin(2 * np.pi * 120 * t)) * (rng.random(len(t)) > 0.5)
    sig = sig * ((t * 40).astype(int) % 2) + hp(rng.standard_normal(len(t)), 4000) * 0.3
    return sig * np.exp(-t * 6) * 0.35


def coin():
    t = t_arr(0.5)
    a = np.sin(2 * np.pi * midi(88) * t) * (t < 0.08)
    b = np.sin(2 * np.pi * midi(95) * t) * (t >= 0.08)
    return (a + b) * np.exp(-t * 6) * 0.4


def norm(x, peak=0.9):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def main():
    tl = json.load(open(os.path.join(ROOT, "src", "data", "timeline.json")))
    total = tl["durationMs"] / 1000
    first = {}
    for p in tl["phrases"]:
        first.setdefault(p["scene"], p["startMs"] / 1000)
    why = first["why"]
    build = first["skill"]
    drums_in = first["pillars"]
    cta = first["cta"]

    bpm = 96
    beat = 60 / bpm
    bar = 4 * beat
    music = np.zeros(int((total + 0.5) * SR))

    # A: tense opening (Am - F - Dm - E), sub pulse, clock ticks.
    prog_a = [(45, [57, 60, 64]), (41, [57, 60, 65]), (38, [57, 62, 65]), (40, [56, 59, 64])]
    t0 = 0.0
    i = 0
    while t0 < why - 0.2:
        root, chord = prog_a[i % 4]
        d = min(bar, why - t0)
        place(music, pad(chord, d + 0.6, 1100) * 0.55, t0)
        for k in range(8):
            tt = t0 + k * beat / 2
            if tt < why - 0.25:
                place(music, sub(root, beat / 2 * 0.9) * (0.45 if k % 2 == 0 else 0.28), tt)
        for k in range(16):
            tt = t0 + k * beat / 4
            if tt < why - 0.25:
                place(music, tick() * (0.22 if k % 4 == 0 else 0.1), tt)
        t0 += bar
        i += 1

    # B + C: hopeful build (F - G - Am - C), keys arpeggio; drums from the pillars.
    prog_b = [(41, [57, 60, 65]), (43, [59, 62, 67]), (45, [57, 60, 64]), (48, [55, 60, 64])]
    t0 = build - 0.1
    i = 0
    while t0 < cta - 0.3:
        root, chord = prog_b[i % 4]
        d = min(bar, cta - t0)
        place(music, pad(chord, d + 0.6, 1600) * 0.5, t0)
        arp = chord + [chord[1] + 12]
        for k in range(8):
            tt = t0 + k * beat / 2
            if tt < cta - 0.3:
                place(music, keys(arp[k % 4] + 12, 0.9) * 0.16, tt)
        if t0 >= drums_in - 0.2:
            for k in range(4):
                tt = t0 + k * beat
                if tt < cta - 0.3:
                    place(music, kick() * 0.55, tt)
                    place(music, sub(root, beat * 0.9) * 0.35, tt)
                    if k % 2 == 1:
                        place(music, clap() * 0.35, tt)
                    place(music, hat() * 0.12, tt + beat / 2)
        t0 += bar
        i += 1

    # D: CTA lift (C - G - Am - F), full groove, ends with a chord swell.
    prog_d = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [57, 60, 64]), (41, [57, 60, 65])]
    t0 = cta - 0.15
    i = 0
    while t0 < total - 1.2:
        root, chord = prog_d[i % 4]
        place(music, pad(chord, bar + 0.6, 2400) * 0.5, t0)
        for k in range(16):
            tt = t0 + k * beat / 4
            if tt < total - 1.4:
                place(music, pluck(chord[k % 3] + 12 + (12 if k % 8 == 7 else 0)) * 0.12, tt)
        for k in range(4):
            tt = t0 + k * beat
            if tt < total - 1.4:
                place(music, kick() * 0.6, tt)
                place(music, sub(root, beat * 0.9) * 0.38, tt)
                if k % 2 == 1:
                    place(music, clap() * 0.4, tt)
                place(music, hat() * 0.14, tt + beat / 2)
                place(music, hat(0.03) * 0.08, tt + beat / 4 * 3)
        t0 += bar
        i += 1
    place(music, pad([48, 55, 60, 64, 67], 2.4, 2000) * 0.6, total - 1.6)

    music = reverb(music, 1.8, 0.18)
    fade_in = int(0.25 * SR)
    music[:fade_in] *= np.linspace(0, 1, fade_in)
    fade_out = int(1.2 * SR)
    end = int(total * SR)
    music = music[:end]
    music[-fade_out:] *= np.linspace(1, 0, fade_out)
    stereo = np.stack([music, np.roll(music, 240)], axis=1)
    sf.write(os.path.join(ROOT, "public", "music.wav"), norm(stereo, 0.8), SR, subtype="PCM_16")

    sfx_dir = os.path.join(ROOT, "public", "sfx")
    os.makedirs(sfx_dir, exist_ok=True)
    fx = {
        "whoosh": whoosh(0.7, True),
        "whoosh-down": whoosh(0.6, False),
        "impact": impact(),
        "riser": riser(1.1),
        "pop": pop(),
        "click": click(),
        "beep": beep(),
        "chime": chime(),
        "glitch": glitch(),
        "coin": coin(),
    }
    for name, sig in fx.items():
        sf.write(os.path.join(sfx_dir, f"{name}.wav"), norm(sig, 0.85).astype(np.float32), SR, subtype="PCM_16")
    print(f"music {total:.2f}s, {len(fx)} sfx")


if __name__ == "__main__":
    main()
