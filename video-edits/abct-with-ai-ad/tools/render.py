"""Virtual camera: face-tracked punch-in cuts, slow push-ins, punch/shake on cuts, white flash on impacts.
Writes raw BGR frames to stdout for ffmpeg."""
import json, math, sys
import cv2, numpy as np

src, faces_p, cuts_p = sys.argv[1:4]
W, H = 1080, 1920
F = json.load(open(faces_p)); cuts = json.load(open(cuts_p))
fps = F["fps"]
ft = np.array([f[0] for f in F["faces"]]); fx = np.array([f[1] for f in F["faces"]]); fy = np.array([f[2] for f in F["faces"]])


def smooth(t, v, tau=0.6):
    out = np.empty_like(v); s = v[0]
    for i in range(len(v)):
        a = 1 - math.exp(-(t[i] - t[i - 1]) / tau) if i else 1
        s += a * (v[i] - s); out[i] = s
    # run backwards too (zero-phase) so the camera doesn't lag the subject
    s = out[-1]
    for i in range(len(v) - 1, -1, -1):
        a = 1 - math.exp(-(t[min(i + 1, len(t) - 1)] - t[i]) / tau) if i < len(v) - 1 else 1
        s += a * (out[i] - s); out[i] = s
    return out


sx, sy = smooth(ft, fx), smooth(ft, fy)
cap = cv2.VideoCapture(src); i = 0; out = sys.stdout.buffer
while True:
    ok, frame = cap.read()
    if not ok: break
    t = i / fps
    c = max(k for k in range(len(cuts)) if cuts[k][0] <= t + 1e-6)
    t0, z0, fx_flag = cuts[c]; t1 = cuts[c + 1][0] if c + 1 < len(cuts) else t0 + 3
    dt = t - t0
    z = z0 * (1 + 0.035 * dt / (t1 - t0))               # slow push-in through the shot
    if c > 0: z *= 1 + 0.07 * math.exp(-dt / 0.06)       # punch: overshoot then settle
    cx, cy = np.interp(t, ft, sx), np.interp(t, ft, sy)
    cw, ch = W / z, H / z
    x0 = min(max(cx - cw / 2, 0), W - cw); y0 = min(max(cy - 0.36 * ch, 0), H - ch)
    if fx_flag and c > 0 and dt < 0.3:                    # camera shake on impact cuts
        amp = 10 / z * math.exp(-dt / 0.08)
        x0 = min(max(x0 + amp * math.sin(dt * 90), 0), W - cw); y0 = min(max(y0 + amp * math.cos(dt * 70), 0), H - ch)
    M = np.float32([[z, 0, -x0 * z], [0, z, -y0 * z]])
    img = frame if z == 1 and x0 == 0 and y0 == 0 else cv2.warpAffine(frame, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    if fx_flag and c > 0 and dt < 0.12:                   # white flash
        a = 0.55 * (1 - dt / 0.12)
        img = cv2.addWeighted(img, 1 - a, np.full_like(img, 255), a, 0)
    out.write(img.tobytes()); i += 1
print(f"frames {i}", file=sys.stderr)
