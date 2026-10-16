"""Time the English captions to a voiceover that doesn't read the script word
for word (e.g. a Hinglish take), using per-line spans plus keyword anchors.

Usage: python time_lines.py <voice audio> <reel-dir> <lines.json> [<parakeet-model-dir>]

<lines.json> holds when each script line is spoken in this take:
    {"lines": {"surgery": [0.05, 3.67], ...}, "anchors": [["surgery", 0.40], ...]}
Line spans come from the pauses in the take. Anchors are English words the
speaker says as-is (surgery, YouTube, ABCT...). With a sherpa-onnx Parakeet
model dir they are re-detected by ASR and saved back into <lines.json>;
without one, the saved anchors are reused.

Inside each line, a caption word that matches an anchor is pinned to it (when
that still leaves every word at least MIN_WORD seconds); the other words are
spread between the pinned ones in proportion to their length. Writes
<reel-dir>/public/vo.wav and <reel-dir>/src/timeline.json like align.py does.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import END_HOLD, SCRIPT  # noqa: E402

MIN_WORD = 0.18  # shortest time a caption word may get, so pages stay readable


def norm(w):
    return re.sub(r"[^a-z0-9-]", "", w.lower())


def matches(caption_word, heard):
    a, b = norm(caption_word), norm(heard)
    if not a or not b:
        return False
    if a == b:
        return len(a) >= 2
    short, long_ = sorted((a, b), key=len)
    return len(short) >= 4 and long_.startswith(short[:5] if len(short) >= 5 else short)


def detect_anchors(audio, model_dir):
    import numpy as np
    import sherpa_onnx

    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=f"{model_dir}/encoder.int8.onnx",
        decoder=f"{model_dir}/decoder.int8.onnx",
        joiner=f"{model_dir}/joiner.int8.onnx",
        tokens=f"{model_dir}/tokens.txt",
        model_type="nemo_transducer",
    )
    stream = rec.create_stream()
    stream.accept_waveform(16000, np.frombuffer(pcm, dtype=np.float32))
    rec.decode_stream(stream)
    words = []
    for tok, ts in zip(stream.result.tokens, stream.result.timestamps):
        if tok.startswith(" ") or not words:
            words.append([tok.strip(), round(float(ts), 2)])
        else:
            words[-1][0] += tok
    return [[re.sub(r"[.,!?:;]+$", "", w), t] for w, t in words]


def time_line(words, start, end, anchors):
    n = len(words)
    weights = [len(norm(w)) + 2 for w in words]
    pins = [(0, start)]  # (word index, start time); word 0 always starts the line
    next_free = 0
    for heard, t in anchors:
        if not (start - 0.15 <= t <= end):
            continue
        t = max(t, start)
        i = next((k for k in range(next_free, n) if matches(words[k], heard)), None)
        if i is None:
            continue
        if i == 0:
            # the line opens with a filler word before the caption's first word
            if t > start and n * MIN_WORD <= end - t:
                pins[0] = (0, t)
            next_free = 1
            continue
        prev_i, prev_t = pins[-1]
        if (i - prev_i) * MIN_WORD <= t - prev_t and (n - i) * MIN_WORD <= end - t:
            pins.append((i, t))
            next_free = i + 1
    pins.append((n, end))
    starts = [0.0] * n
    for (a, ta), (b, tb) in zip(pins, pins[1:]):
        total, t = sum(weights[a:b]), ta
        for k in range(a, b):
            starts[k] = t
            t += (tb - ta) * weights[k] / total
    return [
        {"text": w, "start": round(starts[k], 3), "end": round(starts[k + 1] if k + 1 < n else end, 3)}
        for k, w in enumerate(words)
    ]


def main():
    audio, reel, spec_path = sys.argv[1:4]
    model_dir = sys.argv[4] if len(sys.argv) > 4 else None
    with open(spec_path) as f:
        spec = json.load(f)
    if model_dir:
        spec["anchors"] = detect_anchors(audio, model_dir)
        with open(spec_path, "w") as f:
            json.dump(spec, f, indent=1)
    anchors = spec.get("anchors", [])

    lines = []
    for line_id, text, _ in SCRIPT:
        start, end = spec["lines"][line_id]
        words = time_line(text.split(), start, end, anchors)
        start = words[0]["start"]
        lines.append({"id": line_id, "text": text, "start": start, "end": end, "words": words})
        print(f"{line_id:10s} {start:6.2f}-{end:6.2f}  " + " ".join(f"{w['text']}@{w['start']:.2f}" for w in words))

    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", audio, "-ac", "1", "-ar", "44100", os.path.join(reel, "public", "vo.wav")],
        check=True,
    )
    duration = round(lines[-1]["end"] + END_HOLD, 3)
    with open(os.path.join(reel, "src", "timeline.json"), "w") as f:
        json.dump({"duration": duration, "lines": lines}, f, indent=1, ensure_ascii=False)
    print(f"video {duration:.2f}s")


if __name__ == "__main__":
    main()
