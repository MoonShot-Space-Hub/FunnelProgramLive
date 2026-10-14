"""Transcribe non-English speech with Whisper (sherpa-onnx), phrase by phrase.

Silero VAD splits the audio into speech segments; Whisper transcribes each one in the source
language and also translates it to English. Writes assets/whisper-segments.json:
[{start, end, text, english, language}], used to write the English captions.

Usage (needs the sherpa-onnx Python package and the model files):
  python3 tools/whisper_segments.py MEDIA MODEL_DIR VAD_ONNX [--language hi|gu|auto]
"""

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
import sherpa_onnx

ROOT = Path(__file__).resolve().parent.parent
SR = 16000


def load_audio(media):
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(media), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(pcm, dtype=np.float32)


def speech_segments(samples, vad_model):
    cfg = sherpa_onnx.VadModelConfig()
    cfg.silero_vad.model = str(vad_model)
    cfg.silero_vad.threshold = 0.45
    cfg.silero_vad.min_silence_duration = 0.35
    cfg.silero_vad.min_speech_duration = 0.25
    cfg.silero_vad.max_speech_duration = 12
    cfg.sample_rate = SR
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=120)
    window = cfg.silero_vad.window_size
    segs = []
    for i in range(0, len(samples), window):
        vad.accept_waveform(samples[i : i + window])
        while not vad.empty():
            segs.append((vad.front.start, np.array(vad.front.samples)))
            vad.pop()
    vad.flush()
    while not vad.empty():
        segs.append((vad.front.start, np.array(vad.front.samples)))
        vad.pop()
    return segs


def recognizer(model_dir, language, task):
    d = Path(model_dir)
    enc = next(d.glob("*encoder.int8.onnx"), None) or next(d.glob("*encoder.onnx"))
    dec = next(d.glob("*decoder.int8.onnx"), None) or next(d.glob("*decoder.onnx"))
    tok = next(d.glob("*tokens.txt"))
    return sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(enc), decoder=str(dec), tokens=str(tok),
        language="" if language == "auto" else language, task=task, num_threads=4,
        tail_paddings=-1,
    )


def run(rec, samples):
    s = rec.create_stream()
    s.accept_waveform(SR, samples)
    rec.decode_stream(s)
    r = s.result
    return r.text.strip(), getattr(r, "lang", "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("media")
    ap.add_argument("model_dir")
    ap.add_argument("vad")
    ap.add_argument("--language", default="auto")
    args = ap.parse_args()

    samples = load_audio(args.media)
    segs = speech_segments(samples, args.vad)
    tr = recognizer(args.model_dir, args.language, "transcribe")
    en = recognizer(args.model_dir, args.language, "translate")
    out = []
    for start, seg in segs:
        text, lang = run(tr, seg)
        english, _ = run(en, seg)
        item = {
            "start": round(start / SR, 2),
            "end": round((start + len(seg)) / SR, 2),
            "language": lang,
            "text": text,
            "english": english,
        }
        out.append(item)
        print(f"{item['start']:6.2f}-{item['end']:6.2f} [{lang}] {text}\n{'':15}EN: {english}", flush=True)
    dest = ROOT / "assets/whisper-segments.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(out)} segments -> {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
