"""Export the English caption pages as an .srt file (for platform-native subtitles)."""
import json, sys

PROPER = {"garba": "Garba", "navratri": "Navratri", "i'm": "I'm", "1-hour": "1-hour"}
GRAPHIC_TEXT = {24.42: "Step 1: Entry, Exit, Stop Loss, Target", 43.88: "FREE!"}

def fix_case(word):
    core = word.rstrip(",.?!")
    return PROPER.get(core, core) + word[len(core):]


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

pages = json.load(open(sys.argv[1]))
out = []
for i, p in enumerate(pages, 1):
    if p["mode"] == "graphic":
        text = GRAPHIC_TEXT.get(round(p["start"], 2), "")
    else:
        text = " ".join(w["text"] for l in p["lines"] for w in l["words"])
        text = text[0] + text[1:].lower() if text else text
        text = " ".join(fix_case(w) for w in text.split())
    out.append(f"{i}\n{ts(p['start'])} --> {ts(p['end'])}\n{text}\n")
open(sys.argv[2], "w").write("\n".join(out))
print(f"wrote {len(out)} cues to {sys.argv[2]}")
