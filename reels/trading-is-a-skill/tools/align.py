"""Use a recorded voiceover (e.g. an ElevenLabs export) and time every word.

Usage: python align.py <voice audio file> <reel-dir>

Force-aligns the script in script.py against the recording with PocketSphinx
(its English model ships inside the PyPI package, so nothing is downloaded),
then writes <reel-dir>/public/vo.wav and <reel-dir>/src/timeline.json in the
same format tts.py produces, so the captions and scenes follow the new voice.
"""
import json
import os
import re
import subprocess
import sys

from pocketsphinx import Decoder

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import END_HOLD, SCRIPT  # noqa: E402

FPS = 100  # PocketSphinx frames per second

# Words missing from PocketSphinx's dictionary, in CMU phones
EXTRA_WORDS = {
    "youtube": "Y UW T UW B",
    "abct": "EY B IY S IY T IY",
    "masterclass": "M AE S T ER K L AE S",
    "ai": "EY AY",
}


def dict_words(word):
    """Caption word -> the dictionary words the aligner sees ("one-hour" -> one, hour)."""
    return [w for w in re.split(r"-", word.lower().strip(".,!?:;")) if w]


def main():
    src, reel = sys.argv[1:3]
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    os.makedirs(os.path.join(reel, "public"), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "44100", os.path.join(reel, "public", "vo.wav")],
        check=True,
    )

    dec = Decoder(samprate=16000, bestpath=False)
    for word, phones in EXTRA_WORDS.items():
        if dec.lookup_word(word) is None:
            dec.add_word(word, phones, True)

    script_words = [(line_id, w) for line_id, text, _ in SCRIPT for w in text.split()]
    flat = [d for _, w in script_words for d in dict_words(w)]
    missing = [w for w in flat if dec.lookup_word(w) is None]
    if missing:
        sys.exit(f"Not in dictionary, add to EXTRA_WORDS: {sorted(set(missing))}")

    dec.set_align_text(" ".join(flat))
    dec.start_utt()
    dec.process_raw(pcm, full_utt=True)
    dec.end_utt()
    aligned = [
        (re.sub(r"\(\d+\)$", "", s.word), s.start_frame / FPS, (s.end_frame + 1) / FPS)
        for s in dec.seg()
        if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")
    ]
    if [a[0] for a in aligned] != flat:
        sys.exit("Alignment did not cover the whole script - is this the same script?")

    lines = []
    i = 0
    for line_id, text, _ in SCRIPT:
        words = []
        for w in text.split():
            n = len(dict_words(w))
            span = aligned[i:i + n]
            words.append({"text": w, "start": round(span[0][1], 3), "end": round(span[-1][2], 3)})
            i += n
        lines.append({"id": line_id, "text": text, "start": words[0]["start"], "end": words[-1]["end"], "words": words})
        print(f"{line_id:10s} {lines[-1]['start']:6.2f}-{lines[-1]['end']:6.2f}  {text}")

    duration = round(lines[-1]["end"] + END_HOLD, 3)
    with open(os.path.join(reel, "src", "timeline.json"), "w") as f:
        json.dump({"duration": duration, "lines": lines}, f, indent=1, ensure_ascii=False)
    print(f"video {duration:.2f}s")


if __name__ == "__main__":
    main()
