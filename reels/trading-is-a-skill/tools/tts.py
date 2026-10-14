"""Synthesize the reel voiceover with Kokoro and write word-level timings.

Usage: python tts.py <kokoro-timed.onnx> <voices-v1.0.bin> <out-dir>

Writes <out-dir>/public/vo.wav and <out-dir>/src/timeline.json. Each line of
the script is synthesized on its own so the gap after it can be tuned for
pacing; word timings come from the model's per-phoneme durations (see
patch_model.py).
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

SPEED = 1.08
LEAD_IN = 0.15
TAIL = 0.9

# (id, text shown in captions, pause after the line in seconds)
SCRIPT = [
    ("surgery", "You wouldn't watch one surgery video and start operating on somebody.", 0.35),
    ("plane", "You wouldn't read one article and try to fly a plane.", 0.40),
    ("youtube", "But people watch three YouTube videos,", 0.45),
    ("account", "and start operating their trading account.", 0.50),
    ("why", "Why?", 0.55),
    ("skill", "Trading is also a skill.", 0.30),
    ("requires", "And every real skill requires:", 0.30),
    ("education", "Education.", 0.25),
    ("practice", "Practice.", 0.25),
    ("rules", "Rules.", 0.50),
    ("overnight", "You don't need to learn everything overnight.", 0.25),
    ("shortcut", "But you do need to stop treating a professional skill like a shortcut.", 0.60),
    ("cta1", "If you want a structured place to begin,", 0.15),
    ("cta2", "watch my free one-hour ABCT With AI Masterclass.", 0.25),
    ("cta3", "Link is below.", 0.0),
]

# Words espeak gets wrong, as Kokoro phonemes
PHONEMES = {
    "abct": "ˌeɪbˌiːsˌiːtˈiː",
    "a": "ɐ",
    "to": "tə",
}

PUNCT = ".,!?:;"


def phonemize_word(kokoro, word):
    core = word.strip(PUNCT)
    tail = word[len(word.rstrip(PUNCT)):]
    if tail == ":":
        tail = ","
    ph = PHONEMES.get(core.lower())
    if ph is None:
        ph = kokoro.tokenizer.phonemize(core, "en-us").replace(" ", "")
    return ph + tail


def main():
    model, voices, out = sys.argv[1:4]
    kokoro = Kokoro(model, voices)
    voice = 0.55 * kokoro.get_voice_style("am_michael") + 0.45 * kokoro.get_voice_style("am_fenrir")

    sr = 24000
    chunks = [np.zeros(int(LEAD_IN * sr), dtype=np.float32)]
    cursor = LEAD_IN
    lines = []
    for line_id, text, pause in SCRIPT:
        words = text.split()
        phon_words = [phonemize_word(kokoro, w) for w in words]
        phonemes = " ".join(phon_words)
        audio, sr, spoken = kokoro.create_timed(phonemes, voice, speed=SPEED, is_phonemes=True)
        assert "".join(t.phoneme for t in spoken) == phonemes, (phonemes, spoken)

        word_times = []
        i = 0
        for w, pw in zip(words, phon_words):
            span = spoken[i:i + len(pw.rstrip(PUNCT))]
            word_times.append({
                "text": w,
                "start": round(cursor + span[0].start, 3),
                "end": round(cursor + span[-1].end, 3),
            })
            i += len(pw) + 1

        duration = len(audio) / sr
        lines.append({
            "id": line_id,
            "text": text,
            "start": round(cursor, 3),
            "end": round(cursor + duration, 3),
            "words": word_times,
        })
        chunks.append(audio.astype(np.float32))
        chunks.append(np.zeros(int(pause * sr), dtype=np.float32))
        cursor += duration + pause
        print(f"{line_id:10s} {lines[-1]['start']:6.2f}-{lines[-1]['end']:6.2f}  {phonemes}")

    chunks.append(np.zeros(int(TAIL * sr), dtype=np.float32))
    audio = np.concatenate(chunks)
    peak = np.abs(audio).max()
    audio = audio / peak * 0.89

    os.makedirs(os.path.join(out, "public"), exist_ok=True)
    os.makedirs(os.path.join(out, "src"), exist_ok=True)
    sf.write(os.path.join(out, "public", "vo.wav"), audio, sr)
    total = len(audio) / sr
    with open(os.path.join(out, "src", "timeline.json"), "w") as f:
        json.dump({"duration": round(total, 3), "lines": lines}, f, indent=1, ensure_ascii=False)
    print(f"total {total:.2f}s")


if __name__ == "__main__":
    main()
