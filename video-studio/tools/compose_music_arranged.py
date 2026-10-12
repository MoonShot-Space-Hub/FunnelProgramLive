"""Original music bed driven by an arrangement file (no samples or third-party audio).

usage: python3 -I compose_music_arranged.py <arrangement.json> <out.wav>

arrangement.json:
{
  "bpm": 102.56, "anchor": 27.48,            # a bar line lands exactly on `anchor` (s)
  "duration": 36.6,
  "chords": {"Am": [45, [57,60,64]], ...},     # name -> [bass midi, chord tones midi]
  "bars": [["Am","A"], ["F","A"], ...],        # one entry per bar from first_bar; section: intro|A|build|B|break|end
  "first_bar": 1.74,                           # time of bars[0] (should be anchor - k*bar)
  "intro": {"until": 1.74, "chord": "Am", "impact": 0.0},
  "impacts": [18.12], "crashes": [18.12, 27.48], "risers": [[15.78, 18.12], [26.31, 27.48]],
  "snare_rolls": [[16.95, 18.12]]
}
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

cfg = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
SR = 48000
DUR = cfg["duration"]
N = int(DUR * SR)
rng = np.random.default_rng(cfg.get("seed", 20261012))
BAR = 240.0 / cfg["bpm"]
BEAT = BAR / 4

mix_l, mix_r, verb_send = np.zeros(N), np.zeros(N), np.zeros(N)
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
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(freq, d, voices=1, detune=0.0):
    tt = t(d)
    out = np.zeros_like(tt)
    for v in range(voices):
        f = freq * (1 + detune * (v - (voices - 1) / 2))
        out += 2 * ((f * tt + rng.random()) % 1.0) - 1
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


def kick():
    tt = t(0.42)
    body = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-tt / 0.035)) / SR) * np.exp(-tt / 0.17)
    click = filt(rng.standard_normal(len(tt)), "highpass", 2500) * np.exp(-tt / 0.004) * 0.35
    return np.tanh(1.6 * (body + click))


def clap():
    tt = t(0.32)
    e = np.zeros_like(tt)
    for k, off in enumerate((0.0, 0.011, 0.022)):
        e += np.where(tt >= off, np.exp(-(tt - off) / (0.012 if k < 2 else 0.12)), 0)
    return filt(rng.standard_normal(len(tt)), "bandpass", [900, 4200]) * e


def hat(open_=False):
    tt = t(0.32 if open_ else 0.06)
    return filt(rng.standard_normal(len(tt)), "highpass", 7500) * np.exp(-tt / (0.11 if open_ else 0.018))


def crash():
    tt = t(2.4)
    return filt(rng.standard_normal(len(tt)), "highpass", 4000) * np.exp(-tt / 0.7)


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


def pad_chord(notes, d):
    s = sum(saw(midi(m), d, voices=3, detune=0.006) for m in notes) / len(notes)
    return filt(s, "lowpass", 2400) * env_adsr(d, 0.25, 0.3, 0.8, 0.35)


def bass_note(m, d):
    s = saw(midi(m), d, voices=2, detune=0.004) + 0.6 * np.sin(2 * np.pi * midi(m) * t(d))
    return filt(s, "lowpass", 520) * env_adsr(d, 0.004, 0.08, 0.75, 0.04)


def pluck(m, bright):
    tt = t(0.32)
    s = saw(midi(m), 0.32) * 0.6 + np.sin(2 * np.pi * midi(m) * tt) * 0.5
    return filt(s, "lowpass", 3200 if bright else 1900) * np.exp(-tt / 0.12)


CH = cfg["chords"]
ARP = [0, 1, 2, 1, 0, 2, 1, 2]

# Intro: soft pad (speech may start immediately) + optional impact.
intro = cfg.get("intro")
if intro:
    root, tones = CH[intro["chord"]]
    d = intro["until"] + 0.2
    put(pad_chord(tones, d) * np.linspace(0.3, 1, int(d * SR)), 0.0, 0.28, send=0.4)
    if "impact" in intro:
        put(impact(), intro["impact"], 0.55)

for b, (name, sec) in enumerate(cfg["bars"]):
    t0 = cfg["first_bar"] + b * BAR
    if t0 >= DUR:
        break
    root, tones = CH[name]
    full = sec in ("B", "end")
    drums = sec in ("A", "B", "build", "end")
    pad_gain = {"A": 0.24, "build": 0.26, "B": 0.30, "break": 0.34, "end": 0.30}[sec]
    put(pad_chord(tones, BAR * (1.5 if sec == "end" else 1.0)), t0, pad_gain, pan=-0.15, send=0.5)
    if full or sec == "break":
        put(pad_chord([n + 12 for n in tones], BAR), t0, 0.10, pan=0.25, send=0.6)
    for beat in range(4):
        bt = t0 + beat * BEAT
        if drums and not (sec == "end" and beat > 1):
            put(kick(), bt, 0.95)
            kick_times.append(bt)
            if beat in (1, 3):
                put(clap(), bt, 0.45, pan=0.05, send=0.15)
            put(hat(), bt, 0.16, pan=0.3)
            put(hat(open_=full), bt + BEAT / 2, 0.22 if full else 0.13, pan=0.35)
            if full or sec == "build":
                put(hat(), bt + BEAT / 4, 0.08, pan=-0.3)
                put(hat(), bt + 3 * BEAT / 4, 0.08, pan=-0.3)
        if sec != "break":
            put(bass_note(root, BEAT / 2 * 0.9), bt, 0.5)
            put(bass_note(root + (12 if full else 0), BEAT / 2 * 0.9), bt + BEAT / 2, 0.42)
        elif beat == 0:
            put(bass_note(root, BAR * 0.95), bt, 0.32)
    for k in range(16):
        if sec == "break" and k % 2:
            continue
        m = tones[ARP[k % 8]] + 12 + (12 if (full and k % 4 == 3) else 0)
        g = {"A": 0.085, "build": 0.1, "B": 0.12, "break": 0.09, "end": 0.1}[sec]
        put(pluck(m, full), t0 + k * BEAT / 4, g, pan=(-0.4 if k % 2 else 0.4), send=0.45 if sec == "break" else 0.35)

for at in cfg.get("impacts", []):
    put(impact(), at, 0.4)
for at in cfg.get("crashes", []):
    put(crash(), at, 0.3, pan=0.2)
for a, b in cfg.get("risers", []):
    put(riser(b - a), a, 0.28)
for a, b in cfg.get("snare_rolls", []):
    tt0 = a
    while tt0 < b - 1e-6:
        prog = (tt0 - a) / (b - a)
        put(clap(), tt0, 0.18 + 0.32 * prog, pan=0.05)
        tt0 += BEAT / (2 if prog < 0.5 else 4)

pump = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(min(N - i, int(BEAT * SR)))
    pump[i:i + len(seg)] = np.minimum(pump[i:i + len(seg)], 1 - 0.55 * np.exp(-seg / SR / 0.09))
ir_t = t(1.4)
ir = filt(rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35), "lowpass", 6000)
wet = fftconvolve(verb_send, ir)[:N] * 0.12
mix_l = (mix_l + wet) * pump ** 0.6
mix_r = (mix_r + np.roll(wet, int(0.011 * SR))) * pump ** 0.6
master = filt(np.stack([mix_l, mix_r]), "highpass", 30).T
master /= np.abs(master).max()
master = np.tanh(master * 1.6) / np.tanh(1.6)
fade = int(cfg.get("fade_out", 0.4) * SR)
master[-fade:] *= np.linspace(1, 0, fade)[:, None]
master *= 10 ** (-1.0 / 20) / np.abs(master).max()
w = wave.open(OUT, "w")
w.setnchannels(2)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((master * 32767).astype(np.int16).tobytes())
w.close()
print(f"wrote {OUT}: {DUR:.2f}s, bar {BAR:.4f}s, bars at {[round(cfg['first_bar'] + k * BAR, 3) for k in range(len(cfg['bars']))]}")
