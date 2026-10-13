"""Face-safety QC for the spec-driven edit.

usage:
  python3 -I tools/qc_face.py make-spec spec.json qc/spec_qc.json
      -> copy of the spec with the footage and the stage background removed (graphics only)
  python3 -I tools/qc_face.py check spec.json faces.json <png_dir> <fps> [margin]
      -> for each RGBA frame of the graphics-only render, count opaque graphic pixels
         inside the speaker's face box. The box is mapped from source time through the
         edit cuts and the A-roll layer's keyframed transform (anchor/position/scale).
"""
import glob, json, os, sys


def bez(x1, x2, x):
    """y for cubic-bezier(x1, 0, x2, 1) at progress x."""
    lo, hi = 0.0, 1.0
    for _ in range(50):
        u = (lo + hi) / 2
        xu = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3
        if xu < x:
            lo = u
        else:
            hi = u
    u = (lo + hi) / 2
    return 3 * (1 - u) * u ** 2 + u ** 3


EASE = {"out": (0.10, 0.20), "in": (0.80, 0.90), "inout": (0.70, 0.30), "soft": (0.3333, 0.6667)}


def ev(v, t):
    if not isinstance(v, dict):
        return v
    ks = v["k"]
    if t <= ks[0][0]:
        return ks[0][1]
    for a, b in zip(ks, ks[1:]):
        if a[0] <= t < b[0]:
            e = a[2] if len(a) > 2 else "out"
            if e == "hold":
                return a[1]
            p = (t - a[0]) / (b[0] - a[0])
            if e != "linear":
                p = bez(*EASE[e], p)
            if isinstance(a[1], list):
                return [x + (y - x) * p for x, y in zip(a[1], b[1])]
            return a[1] + (b[1] - a[1]) * p
    return ks[-1][1]


def make_spec(src, dst):
    s = json.load(open(src))
    for c in s["comps"]:
        if c["id"] == "aroll":
            c["layers"] = [L for L in c["layers"] if L["type"] != "footage"]
        if c["id"] == "main":
            c["layers"] = [L for L in c["layers"] if L["name"] != "Stage background"]
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    json.dump(s, open(dst, "w"))
    print("graphics-only spec ->", dst)


def check(spec_p, faces_p, png_dir, fps, margin=24):
    import numpy as np
    from PIL import Image
    s = json.load(open(spec_p))
    main = next(c for c in s["comps"] if c["id"] == s["main"])
    cam = next(L for L in main["layers"] if L.get("comp") == "aroll")
    aroll = next(c for c in s["comps"] if c["id"] == "aroll")
    segs = [(L["in"], L["out"], L["in"] - L["start"]) for L in aroll["layers"] if L["type"] == "footage"]
    F = json.load(open(faces_p))
    faces = F["faces"]
    hits, worst = [], 0
    frames = sorted(glob.glob(os.path.join(png_dir, "*.png")))
    for fi, f in enumerate(frames):
        t = fi / fps
        src = next((s0 + (t - a) for a, b, s0 in segs if a <= t < b), None)
        if src is None:
            continue
        face = min(faces, key=lambda r: abs(r[0] - src))
        _, fx, fy, fw, fh = face
        ax, ay = cam.get("anchor", [960, 540])
        px, py = ev(cam["position"], t)
        sx, sy = [v / 100 for v in ev(cam["scale"], t)]
        x0 = px + (fx - ax) * sx - margin
        x1 = px + (fx + fw - ax) * sx + margin
        y0 = py + (fy - ay) * sy - margin
        y1 = py + (fy + fh - ay) * sy + margin
        a = np.array(Image.open(f))[:, :, 3]
        H, W = a.shape
        box = a[max(0, int(y0)):min(H, int(y1)), max(0, int(x0)):min(W, int(x1))]
        n = int((box > 24).sum())
        if n:
            hits.append({"t": round(t, 2), "pixels": n, "box": [int(x0), int(y0), int(x1), int(y1)]})
            worst = max(worst, n)
    print(json.dumps({"frames": len(frames), "frames_with_overlap": len(hits), "worst": worst, "hits": hits[:40]}, indent=1))


if __name__ == "__main__":
    if sys.argv[1] == "make-spec":
        make_spec(sys.argv[2], sys.argv[3])
    else:
        check(sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), float(sys.argv[6]) if len(sys.argv) > 6 else 24)
