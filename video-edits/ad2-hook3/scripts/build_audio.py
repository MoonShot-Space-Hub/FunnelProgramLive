"""Mix the final soundtrack: voice + ducked background music + synthesized SFX.

Usage: python build_audio.py <input.mp4> <music.mp3> <timeline.json> <out_dir> <beats.json>
Writes <out_dir>/audio/mix.wav and <beats.json> (music beat grid for beat-synced animation).
"""
import json, subprocess, sys
import numpy as np

SR = 48000
VIDEO, MUSIC, TIMELINE, OUT, BEATS = sys.argv[1:6]
tl = json.load(open(TIMELINE))
DUR = tl["durationSec"]
N = int(round(DUR * SR))
rng = np.random.default_rng(7)


def decode(path, start=0.0):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-i", path, "-vn", "-ac", "2", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fit(x):
    out = np.zeros((N, 2), np.float32)
    out[: min(N, len(x))] = x[:N]
    return out


def db(g):
    return 10 ** (g / 20)


# ---------- voice ----------
voice = fit(decode(VIDEO))
voice *= db(4.0)  # source measures ~-20 LUFS; bring it near -16 before the final loudness pass

# ---------- music + beat grid ----------
music = fit(decode(MUSIC))
mono = music.mean(1)
hop = 512
frames = len(mono) // hop
spec = np.abs(np.fft.rfft(mono[: frames * hop].reshape(frames, hop) * np.hanning(hop), axis=1))
flux = np.maximum(0, np.diff(np.log1p(spec), axis=0)).sum(1)
flux = np.maximum(flux - np.convolve(flux, np.ones(16) / 16, mode="same"), 0)
fps_on = SR / hop
best = (0, 0, 0)
for bpm in np.arange(100, 116, 0.05):
    period = 60 / bpm * fps_on
    for ph in np.linspace(0, period, 48, endpoint=False):
        idx = np.round(np.arange(ph, len(flux), period)).astype(int)
        idx = idx[idx < len(flux)]
        score = flux[idx].mean()
        if score > best[0]:
            best = (score, bpm, ph / fps_on)
_, bpm, phase = best
beats = [round(phase + k * 60 / bpm, 4) for k in range(int((DUR - phase) / (60 / bpm)) + 1)]
json.dump({"bpm": round(float(bpm), 3), "beats": beats}, open(BEATS, "w"))
print(f"music grid: {bpm:.2f} BPM, first beat {phase:.3f}s")

# sidechain-style ducking driven by the voice envelope
env = np.sqrt(np.convolve(voice.mean(1) ** 2, np.ones(960) / 960, mode="same"))
att, rel = np.exp(-1 / (0.015 * SR)), np.exp(-1 / (0.30 * SR))
sm = np.zeros_like(env)
prev = 0.0
for i in range(0, N, 48):  # 1 ms control rate
    e = env[i]
    prev = att * prev + (1 - att) * e if e > prev else rel * prev + (1 - rel) * e
    sm[i : i + 48] = prev
duck = 1 - 0.45 * np.clip(sm / 0.05, 0, 1)
music *= db(-19.0) * duck[:, None]
fade_in, fade_out = int(0.25 * SR), int(0.9 * SR)
music[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
music[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5

# ---------- SFX synthesis ----------
def lowpass_sweep(x, cut_start, cut_peak, cut_end, peak_at):
    n = len(x)
    t = np.linspace(0, 1, n)
    cut = np.where(t < peak_at, cut_start + (cut_peak - cut_start) * (t / peak_at),
                   cut_peak + (cut_end - cut_peak) * ((t - peak_at) / (1 - peak_at)))
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.zeros(n)
    s = 0.0
    for i in range(n):
        s = a[i] * s + (1 - a[i]) * x[i]
        y[i] = s
    return y


def whoosh(dur=0.42, gain=-17):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    y = lowpass_sweep(noise, 300, 5200, 900, 0.45) - lowpass_sweep(noise, 80, 400, 120, 0.45) * 0.8
    t = np.linspace(0, 1, n)
    envl = np.where(t < 0.45, (t / 0.45) ** 2, np.exp(-(t - 0.45) * 7))
    y = y * envl
    y /= np.abs(y).max() + 1e-9
    pan = np.linspace(-0.6, 0.6, n)
    return np.stack([y * np.sqrt((1 - pan) / 2), y * np.sqrt((1 + pan) / 2)], 1) * db(gain) * 1.4


def impact(gain=-12):
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    f = 110 * np.exp(-t * 3) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    crack = lowpass_sweep(rng.standard_normal(n), 3000, 3000, 600, 0.01) * np.exp(-t / 0.04)
    y = body + 0.6 * crack
    y /= np.abs(y).max()
    return np.stack([y, y], 1) * db(gain)


def ding(freq=1568, gain=-21):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 1.5 * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t))
    y *= np.exp(-t / 0.18) * np.minimum(1, t / 0.003)
    y /= np.abs(y).max()
    return np.stack([y, y], 1) * db(gain)


def pop(gain=-24):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 450 + 900 * (t / t[-1])
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * np.minimum(1, t / 0.002)
    return np.stack([y, y], 1) * db(gain)


def click(gain=-16):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    y = rng.standard_normal(n) * np.exp(-t / 0.002) + 0.7 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.012)
    y /= np.abs(y).max()
    return np.stack([y, y], 1) * db(gain)


sfx = np.zeros((N, 2), np.float32)


def place(sound, at):
    i = int(max(0, at) * SR)
    j = min(N, i + len(sound))
    if i < N:
        sfx[i:j] += sound[: j - i]


prev_end = -1.0
for b in tl["brolls"]:
    chained = abs(b["start"] - prev_end) < 0.05
    place(whoosh(0.36 if chained else 0.42, -20 if chained else -17), b["start"] - 0.17)
    if b["type"] == "vs":
        place(whoosh(0.32, -21), b["second"] - 0.15)
    if b.get("impact"):
        place(impact(-13), b["impact"])
    if b["type"] == "checklist":
        place(pop(-20), b["title"])
        for k, (_, at, _) in enumerate(b["items"]):
            place(ding(1318 + 150 * k, -22), at)
    if b["type"] == "trends":
        for key in ("up", "down", "side"):
            place(pop(-24), b[key][0])
    if b.get("ribbon"):
        place(pop(-20), b["ribbon"])
    prev_end = b["end"]
for o in tl["overlays"]:
    if o["type"] == "free":
        place(impact(-14), o["start"])
    if o["type"] == "cta":
        place(whoosh(0.36, -20), o["start"] - 0.12)
        place(click(-15), o["click"])
for s in tl["stickers"]:
    place(pop(-28), s["start"])

mix = voice + music + sfx
peak = np.abs(mix).max()
if peak > 0.98:
    mix *= 0.98 / peak
raw = f"{OUT}/audio/_premix.wav"
import wave
with wave.open(raw, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
# final loudness for social platforms
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", str(SR),
                f"{OUT}/audio/mix.wav"], check=True)
print("wrote", f"{OUT}/audio/mix.wav")
