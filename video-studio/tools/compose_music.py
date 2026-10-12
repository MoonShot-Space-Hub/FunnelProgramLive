"""Original music bed for the AD_2 edit (no samples, no third-party audio).

Upbeat 105.9 BPM pop/tech groove whose bar lines land on the edit's scene cuts
(8.017 s and 12.55 s): intro impact -> groove A under the hook -> riser + crash into
the offer -> fuller groove B -> lift into the CTA -> final resolve.

usage: python3 -I compose_music.py <out.wav> [duration_s]
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
OUT = sys.argv[1]
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 15.4
N = int(DUR * SR)
rng = np.random.default_rng(20261012)

BAR = 4.533 / 2                   # 2.2667 s -> 105.9 BPM
BEAT = BAR / 4
BAR0 = 8.017 - 3 * BAR            # 1.217 s: first downbeat of the groove
BARS = [BAR0 + k * BAR for k in range(7)]          # ..., 8.017, 10.283, 12.55, 14.817
OFFER, CTA, END_HIT = BARS[3], BARS[5], BARS[6]

mix_l = np.zeros(N)
mix_r = np.zeros(N)
verb_send = np.zeros(N)
kick_times = []


def t(d):
    return np.arange(int(d * SR)) / SR


def put(sig, at, gain=1.0, pan=0.0, send=0.0):
    i = int(round(at * SR))
    if i >= N or i + len(sig) <= 0:
        return
    s = sig
    if i < 0:
        s, i = s[-i:], 0
    j = min(N, i + len(s))
    s = s[: j - i] * gain
    mix_l[i:j] += s * np.sqrt(0.5 * (1 - pan))
    mix_r[i:j] += s * np.sqrt(0.5 * (1 + pan))
    if send:
        verb_send[i:j] += s * send


def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(freq, d, voices=1, detune=0.0):
    tt = t(d)
    out = np.zeros_like(tt)
    for v in range(voices):
        f = freq * (1 + detune * (v - (voices - 1) / 2))
        ph = (f * tt + rng.random()) % 1.0
        out += 2 * ph - 1
    return out / voices


def env_adsr(d, a, dec, s, r):
    n = int(d * SR)
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(dec * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(na, 1))[:na]
    e[na:na + nd] = np.linspace(1, s, max(nd, 1))[: len(e[na:na + nd])]
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ---------------------------------------------------------------- drums
def kick():
    tt = t(0.42)
    f = 48 + 110 * np.exp(-tt / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.17)
    click = filt(rng.standard_normal(len(tt)), "highpass", 2500) * np.exp(-tt / 0.004) * 0.35
    return np.tanh(1.6 * (body + click))


def clap():
    tt = t(0.32)
    n = rng.standard_normal(len(tt))
    e = np.zeros_like(tt)
    for k, off in enumerate((0.0, 0.011, 0.022)):
        e += np.where(tt >= off, np.exp(-(tt - off) / (0.012 if k < 2 else 0.12)), 0)
    return filt(n, "bandpass", [900, 4200]) * e


def hat(open_=False):
    d = 0.32 if open_ else 0.06
    tt = t(d)
    return filt(rng.standard_normal(len(tt)), "highpass", 7500) * np.exp(-tt / (0.11 if open_ else 0.018))


def crash():
    tt = t(2.4)
    n = filt(rng.standard_normal(len(tt)), "highpass", 4000)
    return n * np.exp(-tt / 0.7)


def impact():
    tt = t(1.8)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt / 0.08)) / SR) * np.exp(-tt / 0.6)
    air = filt(rng.standard_normal(len(tt)), "lowpass", 900) * np.exp(-tt / 0.25) * 0.5
    return np.tanh(1.3 * (boom + air))


def riser(d):
    tt = t(d)
    n = rng.standard_normal(len(tt))
    out = np.zeros_like(tt)
    seg = int(0.05 * SR)
    for k in range(0, len(tt), seg):
        c = 400 * (12000 / 400) ** (k / len(tt))
        out[k:k + seg] = filt(n[max(0, k - 2000):k + seg], "bandpass", [c * 0.7, min(c * 1.4, 20000)])[-len(out[k:k + seg]):]
    sweep = np.sin(2 * np.pi * np.cumsum(220 * (4 ** (tt / d))) / SR) * 0.25
    return (out + sweep) * (tt / d) ** 2.2


def snare_roll(start, end):
    k, step = 0, BEAT / 2
    tt0 = start
    while tt0 < end - 1e-6:
        prog = (tt0 - start) / (end - start)
        put(clap(), tt0, 0.18 + 0.32 * prog, pan=0.05)
        step = BEAT / (2 if prog < 0.5 else 4)
        tt0 += step
        k += 1


# ---------------------------------------------------------------- harmony
CHORDS = {  # per bar: (bass root midi, chord tones midi)
    0: (45, [57, 60, 64]),   # Am
    1: (41, [57, 60, 65]),   # F
    2: (48, [55, 60, 64]),   # C
    3: (43, [55, 59, 62]),   # G   (offer lift)
    4: (45, [57, 60, 64]),   # Am
    5: (41, [57, 60, 65]),   # F   (CTA)
    6: (48, [55, 60, 64]),   # C   (resolve)
}


def pad_chord(notes, d):
    s = sum(saw(midi(m), d, voices=3, detune=0.006) for m in notes) / len(notes)
    return filt(s, "lowpass", 2400) * env_adsr(d, 0.25, 0.3, 0.8, 0.35)


def bass_note(m, d):
    s = saw(midi(m), d, voices=2, detune=0.004) + 0.6 * np.sin(2 * np.pi * midi(m) * t(d))
    return filt(s, "lowpass", 520) * env_adsr(d, 0.004, 0.08, 0.75, 0.04)


def pluck(m, bright):
    d = 0.32
    tt = t(d)
    s = saw(midi(m), d) * 0.6 + np.sin(2 * np.pi * midi(m) * tt) * 0.5
    lp = filt(s, "lowpass", 3200 if bright else 1900)
    return lp * np.exp(-tt / 0.12)


# ---------------------------------------------------------------- arrangement
# Intro: impact on frame 0 + pad swell + reverse noise into the first downbeat.
put(impact(), 0.0, 0.85)
intro_pad = pad_chord(CHORDS[0][1], BAR0 + 0.2) * np.linspace(0.2, 1, int((BAR0 + 0.2) * SR))
put(intro_pad, 0.0, 0.32, send=0.4)
put(riser(BAR0), 0.0, 0.25)

ARP = [0, 1, 2, 1, 0, 2, 1, 2]
for b in range(7):
    t0 = BARS[b]
    if t0 >= DUR:
        break
    root, tones = CHORDS[b]
    full = b >= 3
    last = b == 6
    # pad
    put(pad_chord(tones, BAR * (1.6 if last else 1.0)), t0, 0.30 if full else 0.24, pan=-0.15, send=0.5)
    put(pad_chord([n + 12 for n in tones], BAR), t0, 0.10 if full else 0.0, pan=0.25, send=0.6)
    if last:
        put(crash(), t0, 0.35, pan=0.2)
        put(impact(), t0, 0.5)
        put(bass_note(root, 1.2), t0, 0.55)
        continue
    for beat in range(4):
        bt = t0 + beat * BEAT
        put(kick(), bt, 0.95)
        kick_times.append(bt)
        if beat in (1, 3):
            put(clap(), bt, 0.45, pan=0.05, send=0.15)
        # bass on 8ths, octave jump on the "and"
        put(bass_note(root, BEAT / 2 * 0.9), bt, 0.5)
        put(bass_note(root + (12 if full else 0), BEAT / 2 * 0.9), bt + BEAT / 2, 0.42)
        # hats
        put(hat(), bt, 0.16, pan=0.3)
        put(hat(open_=full), bt + BEAT / 2, 0.22 if full else 0.13, pan=0.35)
        if full:
            put(hat(), bt + BEAT / 4, 0.08, pan=-0.3)
            put(hat(), bt + 3 * BEAT / 4, 0.08, pan=-0.3)
    # 16th arp, brighter after the offer
    for k in range(16):
        m = tones[ARP[k % 8]] + 12 + (12 if (full and k % 4 == 3) else 0)
        put(pluck(m, full), t0 + k * BEAT / 4, 0.12 if full else 0.085, pan=(-0.4 if k % 2 else 0.4), send=0.35)

# Builds into the offer (8.017) and the CTA (12.55).
snare_roll(OFFER - BEAT * 2, OFFER)
put(riser(BEAT * 4), OFFER - BEAT * 4, 0.3)
put(crash(), OFFER, 0.32, pan=-0.2)
put(impact(), OFFER, 0.35)
put(riser(BEAT * 2), CTA - BEAT * 2, 0.26)
put(crash(), CTA, 0.28, pan=0.2)

# ---------------------------------------------------------------- sidechain pump, reverb, master
pump = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(min(N - i, int(BEAT * SR)))
    pump[i:i + len(seg)] = np.minimum(pump[i:i + len(seg)], 1 - 0.55 * np.exp(-seg / SR / 0.09))
ir_t = t(1.4)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35)
ir = filt(ir, "lowpass", 6000)
wet = fftconvolve(verb_send, ir)[:N] * 0.12
mix_l = (mix_l + wet) * pump ** 0.6
mix_r = (mix_r + np.roll(wet, int(0.011 * SR))) * pump ** 0.6

master = np.stack([mix_l, mix_r], 1)
master = filt(master.T, "highpass", 30).T
master /= np.abs(master).max()
master = np.tanh(master * 1.6) / np.tanh(1.6)  # gentle soft clip, keeps section contrast
fade = int(0.35 * SR)
master[-fade:] *= np.linspace(1, 0, fade)[:, None]
master *= 10 ** (-1.0 / 20) / np.abs(master).max()

import wave
w = wave.open(OUT, "w")
w.setnchannels(2)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((master * 32767).astype(np.int16).tobytes())
w.close()
print(f"wrote {OUT}: {DUR:.2f}s, bars at {[round(b, 3) for b in BARS]}")
