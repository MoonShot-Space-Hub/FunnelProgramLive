"""Make a graphics-only copy of a HyperFrames project for face-safety QC.

usage: python3 -I make_qc_mask_project.py <project_dir> <out_dir>

Copies the project, hides every A-roll <video> in index.html (ids listed in edit.json "aroll_ids", default
a1/a2/a3/aroll) with data-hidden, and makes the root/body backgrounds transparent, so a
`hyperframes render --format png-sequence` of <out_dir> yields RGBA frames containing only the graphics.
"""
import json, os, re, shutil, sys

src, out = sys.argv[1], sys.argv[2]
if os.path.exists(out):
    shutil.rmtree(out)
shutil.copytree(src, out, ignore=shutil.ignore_patterns("renders", ".hyperframes", "node_modules"))
edit = json.load(open(os.path.join(src, "edit.json"))) if os.path.exists(os.path.join(src, "edit.json")) else {}
ids = edit.get("aroll_ids", ["a1", "a2", "a3", "aroll"])
p = os.path.join(out, "index.html")
s = open(p).read()
for vid in ids:
    s = s.replace(f'<video id="{vid}" ', f'<video id="{vid}" data-hidden ')
s = re.sub(r"background:\s*#[0-9a-fA-F]{3,8};", "background: transparent;", s)
open(p, "w").write(s)
print("mask project at", out, "| hidden:", [v for v in ids if f'<video id="{v}" data-hidden' in s])
