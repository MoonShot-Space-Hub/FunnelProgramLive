"""Generate the avatar voiceover + caption timings + lip-sync data.

Uses Kokoro TTS (Apache-2.0, open weights) so the voice is royalty-free.
Each phrase is synthesized separately, so phrase boundaries are exact and
word timings inside a phrase are distributed by phoneme count.

Usage:
  python tools/make_voice.py --models <dir with kokoro-v1.0.onnx + voices-v1.0.bin> \
      [--voice am_michael] [--speed 1.08]

Writes public/voice.wav and src/data/timeline.json.
"""

import argparse
import json
import os
import re

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

FPS = 30
SR_OUT = 48000

# Each entry is synthesized in one pass for natural intonation:
# (text, pause after in seconds, scene id). "|" splits caption pages,
# words wrapped in *stars* are emphasised in the captions.
PHRASES = [
    ("You wouldn't watch *one* *surgery* video | and start *operating* on somebody.", 0.45, "surgery"),
    ("You wouldn't read *one* *article* | and try to *fly* *a* *plane.*", 0.5, "plane"),
    ("But people watch *three* *YouTube* videos...", 0.2, "youtube"),
    ("and start operating | their *trading* *account.*", 0.55, "youtube"),
    ("*Why?*", 0.6, "why"),
    ("Trading is also a *skill.*", 0.3, "skill"),
    ("And every *real* *skill* requires:", 0.3, "skill"),
    ("*Education.*", 0.3, "pillars"),
    ("*Practice.*", 0.3, "pillars"),
    ("*Rules.*", 0.6, "pillars"),
    ("You don't need to learn | *everything* *overnight.*", 0.3, "overnight"),
    ("But you *do* need | to *stop* treating | a *professional* *skill* | like a *shortcut.*", 0.7, "shortcut"),
    ("If you want | a *structured* place | to begin, | watch my *free* *one-hour* | *ABCT* *With* *AI* *Masterclass.*", 0.3, "cta"),
    ("*Link* *is* *below.*", 1.6, "cta"),
]

# Spoken-form fixes (the phonemizer reads "ABCT" as one word).
PHONEME_FIXES = [("ˈæbkt", "ˈeɪ bˈiː sˈiː tˈiː")]

LEAD_IN = 0.35


def trim(audio, sr, thresh=0.012):
    env = np.abs(audio)
    idx = np.where(env > thresh)[0]
    if len(idx) == 0:
        return audio
    start = max(0, idx[0] - int(0.02 * sr))
    end = min(len(audio), idx[-1] + int(0.06 * sr))
    return audio[start:end]


def resample(audio, sr_in, sr_out):
    from scipy.signal import resample_poly
    from math import gcd

    g = gcd(sr_in, sr_out)
    return resample_poly(audio, sr_out // g, sr_in // g).astype(np.float32)


def word_weights(kokoro, words):
    weights = []
    for w in words:
        ph = kokoro.tokenizer.phonemize(w, "en-us")
        for a, b in PHONEME_FIXES:
            ph = ph.replace(a, b)
        ph = re.sub(r"[ˈˌ.,!?:;…\s]", "", ph)
        weights.append(max(2, len(ph)))
    return weights


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True)
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.08)
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()

    kokoro = Kokoro(
        os.path.join(args.models, "kokoro-v1.0.onnx"),
        os.path.join(args.models, "voices-v1.0.bin"),
    )

    out = np.zeros(int(LEAD_IN * SR_OUT), dtype=np.float32)
    phrases = []
    for text, pause, scene in PHRASES:
        spoken = text.replace("*", "").replace("...", ",")
        ph = kokoro.tokenizer.phonemize(spoken, "en-us")
        for a, b in PHONEME_FIXES:
            ph = ph.replace(a, b)
        audio, sr = kokoro.create(ph, voice=args.voice, speed=args.speed, is_phonemes=True)
        audio = trim(audio.astype(np.float32), sr)
        audio = resample(audio, sr, SR_OUT)

        start = len(out) / SR_OUT
        dur = len(audio) / SR_OUT
        out = np.concatenate([out, audio, np.zeros(int(pause * SR_OUT), dtype=np.float32)])

        # Words, the caption page each belongs to, and a timing weight
        # (phoneme count, plus a little extra for punctuation pauses).
        tokens = []
        for page_idx, page in enumerate(text.split("|")):
            for raw in page.split():
                word = raw.replace("*", "")
                tokens.append((page_idx, word, raw.startswith("*")))
        weights = word_weights(kokoro, [t[1] for t in tokens])
        weights = [w + (4 if re.search(r"[,.:?]$", t[1]) else 0) for w, t in zip(weights, tokens)]
        bounds = np.cumsum([0] + weights) / sum(weights) * dur

        # Snap each inner boundary to the quietest point within +-60 ms.
        env = np.convolve(np.abs(audio), np.ones(480) / 480, mode="same")
        for i in range(1, len(bounds) - 1):
            c = int(bounds[i] * SR_OUT)
            lo, hi = max(0, c - int(0.06 * SR_OUT)), min(len(env) - 1, c + int(0.06 * SR_OUT))
            if hi > lo:
                bounds[i] = (lo + int(np.argmin(env[lo:hi]))) / SR_OUT
        # Keep every word on screen for at least 90 ms.
        for i in range(1, len(bounds)):
            bounds[i] = max(bounds[i], bounds[i - 1] + 0.09)
        bounds = np.minimum(bounds, dur)

        pages = {}
        for i, (page_idx, word, emph) in enumerate(tokens):
            pages.setdefault(page_idx, []).append(
                {
                    "text": word,
                    "emphasis": emph,
                    "startMs": round((start + bounds[i]) * 1000),
                    "endMs": round((start + bounds[i + 1]) * 1000),
                }
            )
        for page_idx in sorted(pages):
            words = pages[page_idx]
            phrases.append(
                {
                    "text": " ".join(w["text"] for w in words),
                    "scene": scene,
                    "startMs": words[0]["startMs"],
                    "endMs": words[-1]["endMs"],
                    "words": words,
                }
            )
        print(f"{start:6.2f}s +{dur:4.2f}s  [{scene}] {text}")

    # Gentle loudness normalisation to about -16 LUFS-ish peak headroom.
    peak = np.max(np.abs(out))
    out = out / peak * 0.89

    total_s = len(out) / SR_OUT
    sf.write(os.path.join(args.root, "public", "voice.wav"), out, SR_OUT, subtype="PCM_16")

    # Lip sync: per-frame mouth openness (RMS) and width (spectral brightness).
    hop = SR_OUT // FPS
    n_frames = int(np.ceil(total_s * FPS))
    mouth = []
    for i in range(n_frames):
        seg = out[i * hop : (i + 1) * hop + hop // 2]
        if len(seg) < 64:
            mouth.append([0, 0])
            continue
        rms = float(np.sqrt(np.mean(seg**2)))
        spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        freqs = np.fft.rfftfreq(len(seg), 1 / SR_OUT)
        centroid = float(np.sum(freqs * spec) / (np.sum(spec) + 1e-9))
        mouth.append([rms, centroid])
    rms_arr = np.array([m[0] for m in mouth])
    ref = np.percentile(rms_arr[rms_arr > 0.01], 90) if np.any(rms_arr > 0.01) else 1
    open_ = np.clip(rms_arr / ref, 0, 1.2)
    open_[rms_arr < 0.008] = 0
    width = np.clip((np.array([m[1] for m in mouth]) - 900) / 2600, 0, 1)
    width[rms_arr < 0.008] = 0

    data = {
        "fps": FPS,
        "durationMs": round(total_s * 1000),
        "voice": args.voice,
        "phrases": phrases,
        "mouthOpen": [round(float(v), 3) for v in open_],
        "mouthWide": [round(float(v), 3) for v in width],
    }
    os.makedirs(os.path.join(args.root, "src", "data"), exist_ok=True)
    with open(os.path.join(args.root, "src", "data", "timeline.json"), "w") as f:
        json.dump(data, f)
    print(f"total {total_s:.2f}s, {n_frames} frames")


if __name__ == "__main__":
    main()
