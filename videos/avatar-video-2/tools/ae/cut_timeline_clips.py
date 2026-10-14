"""Cut the per-clip media for the editable After Effects timeline.

Run from the project root after rendering renders/ae/overlays.mov and renders/ae/captions.mov
(ProRes 4444 with alpha, from ae-overlays.html / ae-captions.html):
    python3 tools/ae/cut_timeline_clips.py
Writes renders/timeline/clips/{animations,captions}/NN_<name>_{fill,matte}.mp4 and
renders/timeline/clips.json (what the build script places, and where).
A clip covers the frames HyperFrames shows it: first = ceil(start * 25), last = ceil(end * 25) - 1.
"""
import json, math, re, subprocess
from pathlib import Path

FPS = 25
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "renders/timeline/clips"
SCENES = [
    ("c1", "Money everywhere", 0.56, 2.44), ("c2", "Beliefs installed", 6.76, 9.2),
    ("c3", "Rewind to childhood", 11.0, 13.1), ("c4", "The old beliefs", 13.1, 19.02),
    ("c5", "Strings on your decisions", 21.3, 24.9), ("c6", "Question the old beliefs", 29.1, 31.92),
    ("c7", "New habits, begin today", 31.92, 36.5), ("c8", "Free 1-hour training", 39.9, 42.1),
    ("cta", "Click the link below", 42.04, 43.32),
]

def frames(start, end):
    a = math.ceil(start * FPS - 1e-6)
    b = min(math.ceil(end * FPS - 1e-6), round(43.32 * FPS))
    return a, b

def cut(src, a, b, dest_base):
    t = a / FPS
    common = ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.6f}", "-i", str(src), "-frames:v", str(b - a), "-an"]
    subprocess.run(common + ["-vf", "format=rgb24,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                             "-r", str(FPS), "-movflags", "+faststart", f"{dest_base}_fill.mp4"], check=True)
    subprocess.run(common + ["-vf", "alphaextract,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "12",
                             "-r", str(FPS), "-movflags", "+faststart", f"{dest_base}_matte.mp4"], check=True)

def slug(s):
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")[:40]

clips = {"animations": [], "captions": []}
(OUT / "animations").mkdir(parents=True, exist_ok=True)
(OUT / "captions").mkdir(parents=True, exist_ok=True)
for i, (sid, name, s, e) in enumerate(SCENES, 1):
    a, b = frames(s, e)
    base = f"{i:02d}_{sid}_{slug(name)}"
    cut(ROOT / "renders/ae/overlays.mov", a, b, OUT / "animations" / base)
    clips["animations"].append({"name": f"Scene {i} - {name}", "file": f"clips/animations/{base}", "start": a / FPS, "end": b / FPS})
groups = json.loads(re.search(r"window\.CAPTION_GROUPS = (\[.*\]);", (ROOT / "captions/groups.js").read_text(), re.S).group(1))
for i, g in enumerate(groups, 1):
    a, b = frames(g["start"], g["end"])
    text = " ".join(w["text"] for w in g["words"])
    base = f"{i:02d}_{slug(text)}"
    cut(ROOT / "renders/ae/captions.mov", a, b, OUT / "captions" / base)
    clips["captions"].append({"name": f"Caption {i:02d} - {text}", "text": text, "file": f"clips/captions/{base}",
                              "start": a / FPS, "end": b / FPS,
                              "keywords": [w["text"] for w in g["words"] if w["tone"]]})
(ROOT / "renders/timeline/clips.json").write_text(json.dumps(clips, indent=1))
print(len(clips["animations"]), "animation clips,", len(clips["captions"]), "caption clips")
