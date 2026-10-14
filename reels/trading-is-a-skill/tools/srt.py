"""Write captions.srt (2-3 words per cue, same chunks idea as the burned-in captions).

Usage: python3 tools/srt.py   (run from the reel folder)
"""
import json

MAX_WORDS = 4


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


lines = json.load(open("src/timeline.json"))["lines"]
cues = []
for line in lines:
    words = line["words"]
    for i in range(0, len(words), MAX_WORDS):
        chunk = words[i:i + MAX_WORDS]
        cues.append([chunk[0]["start"], chunk[-1]["end"] + 0.25, " ".join(w["text"] for w in chunk)])
for a, b in zip(cues, cues[1:]):
    a[1] = min(a[1], b[0])
with open("export/captions.srt", "w") as f:
    for n, (s, e, text) in enumerate(cues, 1):
        f.write(f"{n}\n{ts(s)} --> {ts(e)}\n{text}\n\n")
print(len(cues), "cues")
