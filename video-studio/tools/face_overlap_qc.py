"""Face-safety QC: does any graphic pixel land on the speaker's face?

usage: python3 -I face_overlap_qc.py <mask_png_dir> <fps> <faces.json> <edit.json> [margin_px]

mask_png_dir: RGBA frames of the composition rendered WITHOUT the A-roll (graphics only, transparent bg),
              named in frame order (png-sequence output of `hyperframes render --format png-sequence`).
faces.json:   face track on the SOURCE footage: {"faces": [[t, x, y, w, h], ...]}.
edit.json:    {"segments": [[out_start, src_start, dur], ...],
               "camera": {"origin": [ox, oy], "keys": [[t0, t1, s0, s1], ...]}}
Reports, per frame, the number of graphic pixels (alpha > 24) inside the face box grown by margin_px.
"""
import json, os, sys
import numpy as np
from PIL import Image

mask_dir, fps, faces_p, edit_p = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
margin = int(sys.argv[5]) if len(sys.argv) > 5 else 40
faces = np.array(json.load(open(faces_p))["faces"], dtype=float)
edit = json.load(open(edit_p))
frames = sorted(f for f in os.listdir(mask_dir) if f.endswith(".png"))


def src_time(t):
    for out0, src0, dur in edit["segments"]:
        if out0 <= t < out0 + dur + 1e-6:
            return src0 + (t - out0)
    return None


def cam_scale(t):
    for t0, t1, s0, s1 in edit["camera"]["keys"]:
        if t0 <= t < t1:
            return s0 + (s1 - s0) * (t - t0) / (t1 - t0)
    return edit["camera"]["keys"][-1][3]


def face_box(t):
    st = src_time(t)
    if st is None:
        return None
    near = faces[np.abs(faces[:, 0] - st) <= 0.25]          # union of detections within ±0.25 s
    if len(near) == 0:
        near = faces[[np.argmin(np.abs(faces[:, 0] - st))]]
    x0, y0 = near[:, 1].min(), near[:, 2].min()
    x1, y1 = (near[:, 1] + near[:, 3]).max(), (near[:, 2] + near[:, 4]).max()
    s = cam_scale(t)
    ox, oy = edit["camera"]["origin"]
    tx = lambda x: ox + (x - ox) * s
    ty = lambda y: oy + (y - oy) * s
    return [tx(x0) - margin, ty(y0) - margin, tx(x1) + margin, ty(y1) + margin]


worst, hits = 0, []
for i, f in enumerate(frames):
    t = i / fps
    box = face_box(t)
    if box is None:
        continue
    a = np.asarray(Image.open(os.path.join(mask_dir, f)).convert("RGBA"))[:, :, 3]
    H, W = a.shape
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    n = int((a[y0:y1, x0:x1] > 24).sum())
    if n:
        hits.append((round(t, 2), n, [x0, y0, x1, y1]))
    worst = max(worst, n)
print(json.dumps({"frames": len(frames), "margin_px": margin, "frames_with_overlap": len(hits),
                  "worst_pixels": worst, "hits": hits[:60]}, indent=1))
