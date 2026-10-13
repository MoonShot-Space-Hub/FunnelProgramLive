"""Design source of truth for the #CASHTAGS VSL edit -> spec.json (see SCHEMA.md).

usage: python3 -I tools/build_spec.py            (run from the project root)

Every on-screen word comes from the speaker's own lines (transcript.json), the book
cover he supplied, or neutral UI labels. No metrics, prices or claims are invented.
Timing: each moment is keyed to word start times on the edited (retakes removed) timeline.
"""
import json, math, os, sys
from PIL import ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
W, H = 1920, 1080

# ---------- timeline -------------------------------------------------------------
# Source cuts (seconds): keep 0-30.967, 34.48-44.346, 55.3-76.80. Two abandoned
# retakes (30.967-34.48 and 44.346-55.3) are removed; nothing is sped up or reordered.
SEG = [  # (out_in, out_out, source_in)
    (0.0, 929 / FPS, 0.0),
    (929 / FPS, 1225 / FPS, 34.48),
    (1225 / FPS, 1870 / FPS, 55.3),
]
DUR = 1870 / FPS  # 62.333 s


def fr(t):
    return round(round(t * FPS) / FPS, 6)


_tr = json.load(open(os.path.join(ROOT, "transcript.json")))
WORDS = _tr["words"]
# transcript.json was mapped with cuts at 30.96 / 40.85; re-map to the frame-aligned cuts above.
for w in WORDS:
    for key in ("start", "end"):
        s = w[key]
        if s >= 40.85:
            w[key] = s - (40.85 - SEG[2][0])
        elif s >= 30.96:
            w[key] = s + (SEG[1][0] - 30.96)


def ws(i):
    return WORDS[i]["start"]


# ---------- design tokens --------------------------------------------------------
BLUE = "#0866FF"       # Meta Blue
BLUE_TINT = "#E8F0FF"
BLUE_MID = "#9DBDFF"
NAVY = "#0A1F44"
SLATE = "#56657D"
MUTED = "#8C98AA"
LINE = "#E3E8EF"
SOFT = "#F3F5F8"
STAGE = "#EDF1F6"      # background behind the split-screen
WHITE = "#FFFFFF"
DIM = "#8FA3C2"        # caption words not yet spoken (on navy)

CARD_SHADOW = {"color": NAVY, "opacity": 16, "direction": 180, "distance": 18, "softness": 56}
SMALL_SHADOW = {"color": NAVY, "opacity": 10, "direction": 180, "distance": 6, "softness": 18}
FONT_FILES = {k: f"/usr/share/fonts/opentype/inter/{k}.otf" for k in
              ["Inter-Regular", "Inter-Medium", "Inter-SemiBold", "Inter-Bold", "Inter-ExtraBold", "Inter-Black"]}
_fcache = {}


def tw(text, font, size, tracking=0):
    """Advance width of one line of text in px (Inter OTF metrics + AE tracking)."""
    key = (font, size)
    if key not in _fcache:
        _fcache[key] = ImageFont.truetype(FONT_FILES[font], size)
    return _fcache[key].getlength(text) + len(text) * tracking / 1000.0 * size


# ---------- spec helpers ---------------------------------------------------------
def K(keys, t0=0.0):
    """keys: [(t_abs, value, ease?)] -> anim dict in local time (t_abs - t0)."""
    out = []
    for k in keys:
        e = k[2] if len(k) > 2 else "out"
        out.append([fr(k[0] - t0), k[1], e])
    return {"k": out}


def L(type_, name, inp, out, **f):
    d = {"name": name, "type": type_, "in": fr(inp), "out": fr(out)}
    d.update(f)
    return d


def text(name, s, x, y, font, size, color, dur, justify="left", tracking=0, leading=None, **f):
    d = L("text", name, 0, dur, text=s, font=font, size=size, color=color, justify=justify,
          tracking=tracking, position=[x, y], **f)
    if leading:
        d["leading"] = leading
    return d


def rect(name, x, y, w, h, dur, r=0, fill=None, stroke=None, sw=0, **f):
    d = L("rect", name, 0, dur, size=[w, h], radius=r, fill=fill, stroke=stroke, strokeWidth=sw,
          position=[x, y], **f)
    return d


def ellipse(name, x, y, w, h, dur, fill=None, stroke=None, sw=0, **f):
    return L("ellipse", name, 0, dur, size=[w, h], fill=fill, stroke=stroke, strokeWidth=sw,
             position=[x, y], **f)


def path(name, paths, dur, stroke=None, sw=0, fill=None, cap="round", join="round", **f):
    return L("path", name, 0, dur, paths=paths, stroke=stroke, strokeWidth=sw, fill=fill,
             lineCap=cap, lineJoin=join, **f)


def P(v, closed=False, i=None, o=None):
    d = {"v": [[round(a, 2), round(b, 2)] for a, b in v], "closed": closed}
    if i:
        d["i"] = [[round(a, 2), round(b, 2)] for a, b in i]
    if o:
        d["o"] = [[round(a, 2), round(b, 2)] for a, b in o]
    return d


def appear(layer, t, t0, dur=0.45, dy=12, dx=0, blur=None, scale=None):
    """Fade + rise (and optional de-blur / scale) in, local to a comp starting at t0."""
    x, y = layer["position"]
    layer["opacity"] = K([(t, 0), (t + dur, 100)], t0)
    if dx or dy:
        layer["position"] = K([(t, [x + dx, y + dy]), (t + dur, [x, y])], t0)
    if blur:
        layer["blur"] = K([(t, blur), (t + dur, 0)], t0)
    if scale:
        layer["scale"] = K([(t, [scale, scale]), (t + dur, [100, 100])], t0)
    return layer


def appear_scale(layer, t, t0, dur=0.4, s0=85):
    layer["opacity"] = K([(t, 0), (t + dur * 0.6, 100)], t0)
    layer["scale"] = K([(t, [s0, s0]), (t + dur, [100, 100])], t0)
    return layer


# ---------- comps ----------------------------------------------------------------
COMPS = []      # emitted children-first
MAIN_LAYERS = []
MARKERS = []


def comp(cid, name, folder, w, h, dur, layers, bg=WHITE):
    c = {"id": cid, "name": name, "folder": folder, "width": w, "height": h,
         "duration": fr(dur), "bg": bg, "layers": layers}
    COMPS.append(c)
    return c


LANE_L = 56 + 230      # card centre x, left lane (cards x 56-516)
LANE_R = 1404 + 230    # card centre x, right lane (cards x 1404-1864)
CARD_W = 460


def card(cid, name, h, dur, content, w=CARD_W, radius=28):
    """A white rounded card comp: background + content layers (all local to the moment)."""
    bg = rect("Card background", w / 2, h / 2, w - 2, h - 2, dur, r=radius, fill=WHITE, stroke=LINE, sw=1.5)
    return comp(cid, name, "03 Cards", w, h, dur, [bg] + content)


def card_layer(c, cx, cy, side, t_in, t_out, t0, dur, name=None):
    """Card comp placed in a moment comp: slides in from its lane edge, de-blurs, exits."""
    d = 1 if side == "R" else -1
    lay = L("comp", name or c["name"], 0, dur, comp=c["id"], start=0, position=[cx, cy], shadow=CARD_SHADOW)
    keys_p = [(t_in, [cx + 70 * d, cy]), (t_in + 0.6, [cx, cy])]
    keys_o = [(t_in, 0), (t_in + 0.45, 100)]
    keys_b = [(t_in, 14), (t_in + 0.5, 0)]
    keys_s = [(t_in, [96, 96]), (t_in + 0.6, [100, 100])]
    if t_out is not None:
        keys_p += [(t_out, [cx, cy], "in"), (t_out + 0.4, [cx + 40 * d, cy])]
        keys_o += [(t_out, 100, "in"), (t_out + 0.35, 0)]
        keys_b += [(t_out, 0, "in"), (t_out + 0.4, 10)]
    lay["position"] = K(keys_p, t0)
    lay["opacity"] = K(keys_o, t0)
    lay["blur"] = K(keys_b, t0)
    lay["scale"] = K(keys_s, t0)
    return lay


def moment(mid, name, t_in, t_out, layers_fn, marker):
    """Full-frame moment comp placed on the main timeline from t_in to t_out."""
    t_in, t_out = fr(t_in), fr(t_out)
    dur = round(t_out - t_in, 4)
    layers = layers_fn(t_in, dur)
    c = comp(mid, name, "02 Moments", W, H, dur, layers, bg=NAVY)
    MAIN_LAYERS.append(L("comp", name, t_in, t_out, comp=mid, start=fr(t_in)))
    MARKERS.append([fr(t_in), f"{name} | {marker}"])
    return c


def eyebrow(name, s, x, y, dur, color=BLUE):
    return text(name, s.upper(), x, y, "Inter-SemiBold", 16, color, dur, tracking=120)


def check_icon(name, cx, cy, dur, size=1.0, color=WHITE, sw=3.5):
    s = size
    return path(name, [P([(cx - 7 * s, cy + 0.5 * s), (cx - 2 * s, cy + 5.5 * s), (cx + 8 * s, cy - 5 * s)])],
                dur, stroke=color, sw=sw)


def star_pts(cx, cy, R, r):
    pts = []
    for k in range(10):
        a = math.radians(-90 + k * 36)
        rr = R if k % 2 == 0 else r
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def rounded_capsule_path(cx, cy, w, h):
    """Closed rounded-rect path (radius = w/2) as bezier vertices, centred."""
    rr = min(w, h) / 2
    k = 0.5523 * rr
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2
    v = [(x0 + rr, y0), (x1 - rr, y0), (x1, y0 + rr), (x1, y1 - rr), (x1 - rr, y1), (x0 + rr, y1), (x0, y1 - rr), (x0, y0 + rr)]
    i = [(-k * 0, 0), (0, 0), (0, -k), (0, 0), (k, 0), (0, 0), (0, k), (0, 0)]
    o = [(0, 0), (k, 0), (0, 0), (0, k), (0, 0), (-k, 0), (0, 0), (0, -k)]
    return P(v, True, i, o)


# =================================================================================
# M01  Lower third  -- "Hi, my name is Vishal."
# =================================================================================
def m01(t0, dur):
    w, h = 452, 112
    t_in = ws(1)  # "my"
    c = card("c01", "C01 Name lower third", h, dur, [
        rect("Accent bar", 34, h / 2, 6, 56, dur, r=3, fill=BLUE),
        appear(text("Name", "Vishal Malkan", 60, 52, "Inter-Bold", 34, NAVY, dur, tracking=-10), t_in + 0.12, t0, dy=10),
        appear(text("Role", "Author of #CASHTAGS", 61, 84, "Inter-Medium", 20, SLATE, dur), t_in + 0.24, t0, dy=10),
    ], w=w, radius=24)
    return [card_layer(c, 56 + w / 2, 836 + h / 2, "L", t_in, 3.75, t0, dur)]


# =================================================================================
# M02  "how to make money from the stock market in a structured way rather than guessing"
# =================================================================================
def m02(t0, dur):
    h = 400
    title1, title2 = "How to make money", "from the stock market"
    pre = tw("from the ", "Inter-Bold", 32, -10)
    under_w = tw("stock market", "Inter-Bold", 32, -10)
    ty = 98
    content = [
        appear(eyebrow("Eyebrow", "If you're wondering", 36, 54, dur), ws(5), t0, dy=8),
        appear(text("Title", f"{title1}\n{title2}", 36, ty, "Inter-Bold", 32, NAVY, dur, tracking=-10, leading=40), ws(8), t0),
        rect("Stock market underline", 36 + pre, ty + 40 + 10, under_w, 4, dur, r=2, fill=BLUE,
             anchor=[-under_w / 2, 0]),
        rect("Divider", 230, 180, 388, 1.5, dur, fill=LINE),
        # structured row
        rect("Structured row", 230, 236, 388, 64, dur, r=18, fill=BLUE_TINT),
        ellipse("Structured check bg", 70, 236, 34, 34, dur, fill=BLUE),
        check_icon("Structured check", 70, 236, dur, 1.0),
        text("Structured label", "A structured way", 102, 245, "Inter-SemiBold", 24, NAVY, dur, tracking=-5),
        # guessing row
        rect("Guessing row", 230, 314, 388, 64, dur, r=18, fill=SOFT),
        ellipse("Guessing dot bg", 70, 314, 34, 34, dur, fill=WHITE, stroke=LINE, sw=2),
        path("Guessing x", [P([(64, 308), (76, 320)]), P([(76, 308), (64, 320)])], dur, stroke=MUTED, sw=3),
        text("Guessing label", "Guessing", 102, 323, "Inter-SemiBold", 24, MUTED, dur, tracking=-5),
    ]
    und = content[2]
    und["position"] = [36 + pre, ty + 40 + 9]
    und["scale"] = K([(ws(14), [0, 100]), (ws(14) + 0.5, [100, 100])], t0)
    for nm, t in [("Structured row", ws(18)), ("Structured check bg", ws(18) + 0.05), ("Structured check", ws(18) + 0.05),
                  ("Structured label", ws(18) + 0.08), ("Guessing row", ws(22)), ("Guessing dot bg", ws(22) + 0.05),
                  ("Guessing x", ws(22) + 0.05), ("Guessing label", ws(22) + 0.08)]:
        lay = next(x for x in content if x["name"] == nm)
        if lay["type"] == "path":
            lay["opacity"] = K([(t, 0), (t + 0.3, 100)], t0)
        else:
            appear(lay, t, t0, dy=10)
    content.append(path("Guessing strike", [P([(100, 315), (100 + tw("Guessing", "Inter-SemiBold", 24, -5) + 4, 315)])],
                        dur, stroke=MUTED, sw=3, trim={"start": 0, "end": K([(ws(22) + 0.35, 0), (ws(22) + 0.75, 100)], t0)}))
    c = card("c02", "C02 Structured vs guessing", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", ws(5), 6.62, t0, dur)]


# =================================================================================
# M03  Book reveal -- "then I have this book for you called #CASHTAGS."
# =================================================================================
def m03(t0, dur):
    h = 640
    t_in = ws(25)
    content = [
        appear(eyebrow("Eyebrow", "The book", 36, 54, dur), t_in + 0.1, t0, dy=8),
        rect("Cover stage", 230, 300, 388, 430, dur, r=22, fill=SOFT),
        L("image", "Book cover 3D", 0, dur, asset="book", position=[232, 302], scale=[37, 37]),
        text("Title", "#CASHTAGS", 36, 590, "Inter-Black", 52, NAVY, dur, tracking=-20),
        rect("Title underline", 36, 606, tw("#CASHTAGS", "Inter-Black", 52, -20), 5, dur, r=2.5, fill=BLUE),
    ]
    book = content[2]
    book["opacity"] = K([(t_in + 0.2, 0), (t_in + 0.7, 100)], t0)
    book["position"] = K([(t_in + 0.2, [232, 330]), (t_in + 0.9, [232, 302])], t0)
    book["scale"] = K([(t_in + 0.2, [33, 33]), (t_in + 0.9, [37, 37])], t0)
    appear(content[3], ws(33), t0, dy=14, blur=8)
    u = content[4]
    uw = u["size"][0]
    u["anchor"] = [-uw / 2, 0]
    u["position"] = [36, 612]
    u["scale"] = K([(ws(33) + 0.2, [0, 100]), (ws(33) + 0.7, [100, 100])], t0)
    c = card("c03", "C03 Book reveal", h, dur, content)
    return [card_layer(c, LANE_L, 140 + h / 2, "L", t_in, 11.15, t0, dur)]


# =================================================================================
# M04  "This is the book I wrote in 2019,"
# =================================================================================
def m04(t0, dur):
    h = 300
    t_in = ws(34)
    content = [
        appear(eyebrow("Eyebrow", "Written in", 36, 54, dur), t_in + 0.1, t0, dy=8),
        text("Year", "2019", 34, 176, "Inter-ExtraBold", 104, NAVY, dur, tracking=-30),
        rect("Timeline track", 230, 236, 388, 4, dur, r=2, fill=LINE),
        ellipse("Timeline dot", 44, 236, 18, 18, dur, fill=BLUE),
    ]
    appear(content[1], ws(41), t0, dy=22, blur=10, dur=0.55)
    tr = content[2]
    tr["anchor"] = [-194, 0]
    tr["position"] = [36, 236]
    tr["scale"] = K([(ws(41) + 0.15, [0, 100]), (ws(41) + 0.85, [100, 100])], t0)
    appear_scale(content[3], ws(41) + 0.1, t0, s0=0)
    c = card("c04", "C04 Written in 2019", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", t_in, 11.1, t0, dur)]


# =================================================================================
# M05  "thousands of people have read this book and given 5-star reviews on Amazon,"
# =================================================================================
def m05(t0, dur):
    h = 340
    content = [
        appear(eyebrow("Eyebrow", "Readers", 36, 54, dur), ws(42), t0, dy=8),
        appear(text("Title", "Thousands of people\nhave read this book", 36, 98, "Inter-Bold", 32, NAVY, dur,
                    tracking=-10, leading=40), ws(43), t0),
    ]
    sx0, sy, R, gap = 56, 208, 20, 50
    for k in range(5):
        cx = sx0 + k * gap
        content.append(path(f"Star {k + 1} empty", [P(star_pts(cx, sy, R, R * 0.47), True)], dur, fill=LINE, sw=0))
    for k in range(5):
        cx = sx0 + k * gap
        st = path(f"Star {k + 1}", [P(star_pts(0, 0, R, R * 0.47), True)], dur, fill=BLUE, sw=0, position=[cx, sy])
        t = ws(52) + k * 0.08
        st["scale"] = K([(t, [0, 0]), (t + 0.35, [100, 100])], t0)
        content.append(st)
    content.append(appear(text("Label", "5-star reviews", 36, 284, "Inter-Bold", 26, NAVY, dur, tracking=-10), ws(53), t0))
    content.append(appear(text("Label sub", "on Amazon", 36 + tw("5-star reviews ", "Inter-Bold", 26, -10), 284,
                               "Inter-Medium", 26, SLATE, dur, tracking=-10), ws(54), t0))
    c = card("c05", "C05 Readers and reviews", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", ws(42), 15.42, t0, dur)]


# =================================================================================
# M06  "so many people have joined the programs and got 6-figure, 7-figure, 8-figure awards on my stage."
# =================================================================================
def m06(t0, dur):
    h = 560
    content = [
        appear(eyebrow("Eyebrow", "Programs", 36, 54, dur), ws(56), t0, dy=8),
        appear(text("Title", "So many people have\njoined the programs", 36, 98, "Inter-Bold", 32, NAVY, dur,
                    tracking=-10, leading=40), ws(57), t0),
        rect("Baseline", 230, 466, 388, 2, dur, fill=LINE),
    ]
    bw, gap, base = 112, 26, 465
    heights = [96, 158, 220]
    fills = [BLUE_TINT, BLUE_MID, BLUE]
    labels = ["6-figure", "7-figure", "8-figure"]
    for k in range(3):
        cx = 36 + bw / 2 + k * (bw + gap)
        t = ws(66 + k)
        bar = rect(f"Bar {labels[k]}", cx, base, bw, heights[k], dur, r=16, fill=fills[k],
                   anchor=[0, heights[k] / 2])
        bar["scale"] = K([(t, [100, 0]), (t + 0.5, [100, 100])], t0)
        content.append(bar)
        lab = text(f"Label {labels[k]}", labels[k], cx, base - heights[k] - 14, "Inter-Bold", 21, NAVY, dur,
                   justify="center", tracking=-5)
        content.append(appear(lab, t + 0.12, t0, dy=10))
    content.append(appear(text("Awards", "Awards on my stage", 36, 516, "Inter-SemiBold", 22, SLATE, dur), ws(69), t0))
    c = card("c06", "C06 Programs and awards", h, dur, content)
    return [card_layer(c, LANE_L, 140 + h / 2, "L", ws(56), 20.55, t0, dur)]


# =================================================================================
# M07  Split screen -- "It helps traders to go from random guessing work to become a systematic trader."
# =================================================================================
def m07(t0, dur):
    cw, ch = 840, 860
    px0, py0, pw, ph = 56, 300, 728, 500   # chart panel (card-local)
    content = [
        appear(eyebrow("Eyebrow", "It helps traders go from", 56, 76, dur), ws(73) + 0.6, t0, dy=8),
        appear(text("Random guessing", "Random guessing", 56, 160, "Inter-Bold", 56, MUTED, dur, tracking=-20), ws(79), t0),
        rect("Panel", px0 + pw / 2, py0 + ph / 2, pw, ph, dur, r=22, fill=SOFT),
        text("Illustrative", "Illustrative", px0 + pw - 24, py0 + 40, "Inter-Medium", 16, MUTED, dur, justify="right"),
    ]
    sysl = text("Systematic trader", "to become a systematic trader", 56, 236, "Inter-Bold", 44, BLUE, dur, tracking=-15)
    appear(sysl, ws(85) - 0.1, t0, dy=12)
    content.append(sysl)
    rg = content[1]
    rg["opacity"] = K([(ws(79), 0), (ws(79) + 0.45, 100), (ws(85) - 0.1, 100, "soft"), (ws(85) + 0.4, 45)], t0)
    for k in range(1, 4):
        gy = py0 + 70 + k * (ph - 120) / 3
        content.append(rect(f"Grid {k}", px0 + pw / 2, gy, pw - 64, 1.5, dur, fill=LINE))
    # random walk (deterministic) and the systematic curve, chart-area coordinates
    ax0, ax1, ay0, ay1 = px0 + 40, px0 + pw - 40, py0 + 80, py0 + ph - 50
    seed = 20261013
    pts, y = [], 0.55
    for k in range(34):
        seed = (seed * 1103515245 + 12345) % 2 ** 31
        y += ((seed / 2 ** 31) - 0.5) * 0.28
        y = min(0.92, max(0.12, y))
        pts.append((ax0 + (ax1 - ax0) * k / 33, ay0 + (ay1 - ay0) * y))
    rnd = path("Random line", [P(pts)], dur, stroke=MUTED, sw=4, join="round",
               trim={"start": 0, "end": K([(ws(79), 0), (ws(79) + 1.1, 100)], t0)})
    rnd["opacity"] = K([(ws(85) - 0.1, 100, "soft"), (ws(85) + 0.4, 35)], t0)
    content.append(rnd)
    # systematic: smooth rising S-curve with gentle steps
    sp = []
    for k in range(41):
        u = k / 40
        v = 0.86 - 0.70 * (u ** 1.2) + 0.025 * math.sin(u * math.pi * 6)
        sp.append((ax0 + (ax1 - ax0) * u, ay0 + (ay1 - ay0) * v))
    sysp = path("Systematic line", [P(sp)], dur, stroke=BLUE, sw=7, join="round",
                trim={"start": 0, "end": K([(ws(85), 0, "inout"), (ws(85) + 0.9, 100)], t0)})
    content.append(sysp)
    ex, ey = sp[-1]
    dot = ellipse("End dot", ex, ey, 22, 22, dur, fill=BLUE, stroke=WHITE, sw=4)
    appear_scale(dot, ws(85) + 0.85, t0, s0=0, dur=0.35)
    content.append(dot)
    c = card("c07", "C07 Guessing to systematic chart", ch, dur, content, w=cw, radius=36)
    # enters once the A-roll has slid right (face clear of x <= 900), 0.5 s into the 0.8 s move
    lay = card_layer(c, 60 + cw / 2, 60 + ch / 2, "L", ws(73) + 0.5, 25.32, t0, dur)
    return [lay]


# =================================================================================
# M08  "now it's available in a second edition ... also available in English and Hindi as well."
# =================================================================================
def m08(t0, dur):
    h = 470
    content = [
        appear(eyebrow("Eyebrow", "Now available", 36, 54, dur), ws(88) + 0.25, t0, dy=8),
        appear(text("Title", "Second\nedition", 36, 118, "Inter-ExtraBold", 46, NAVY, dur, tracking=-20, leading=50), ws(93), t0, blur=6),
        L("image", "Book thumb", 0, dur, asset="book", position=[352, 128], scale=[17, 17]),
        rect("Timeline track", 36 + 120, 262, 240, 3, dur, r=1.5, fill=LINE),
        ellipse("Dot 2019", 36 + 8, 262, 14, 14, dur, fill=MUTED),
        ellipse("Dot now", 36 + 240, 262, 18, 18, dur, fill=BLUE),
        text("Label 2019", "2019", 36, 296, "Inter-Medium", 17, SLATE, dur),
        text("Label now", "Now · 2nd edition", 36 + 240, 296, "Inter-SemiBold", 17, BLUE, dur, justify="center"),
        rect("Divider", 230, 330, 388, 1.5, dur, fill=LINE),
        appear(eyebrow("Also available", "Also available in", 36, 370, dur, color=SLATE), ws(99), t0, dy=8),
    ]
    appear(content[2], ws(88) + 0.3, t0, dy=16)
    tr = content[3]
    tr["anchor"] = [-120, 0]
    tr["position"] = [36, 262]
    tr["scale"] = K([(ws(93) + 0.1, [0, 100]), (ws(93) + 0.7, [100, 100])], t0)
    appear(content[4], ws(93), t0, dy=0)
    appear(content[6], ws(93), t0, dy=6)
    appear_scale(content[5], ws(93) + 0.6, t0, s0=0)
    appear(content[7], ws(93) + 0.65, t0, dy=6)
    # language chips
    for k, (lang, wi) in enumerate([("English", 102), ("Hindi", 104)]):
        cw = 150
        cx = 36 + cw / 2 + k * (cw + 14)
        chip = rect(f"Chip {lang}", cx, 420, cw, 50, dur, r=25, fill=BLUE)
        appear_scale(chip, ws(wi), t0, s0=80)
        lab = text(f"Chip {lang} label", lang, cx, 427, "Inter-SemiBold", 20, WHITE, dur, justify="center")
        appear(lab, ws(wi) + 0.05, t0, dy=0)
        content += [chip, lab]
    c = card("c08", "C08 Second edition and languages", h, dur, content)
    return [card_layer(c, LANE_L, 140 + h / 2, "L", ws(88) + 0.15, 30.72, t0, dur)]


# =================================================================================
# M09  "You can read this book and get started on your trading journey."
# =================================================================================
def m09(t0, dur):
    h = 400
    content = [appear(eyebrow("Eyebrow", "Your trading journey", 36, 54, dur), ws(107), t0, dy=8)]
    steps = [("Read this book", 109), ("Get started", 113), ("Your trading journey", 117)]
    x, y0, dy = 52, 124, 92
    content.append(rect("Track", x, y0 + dy, 4, 2 * dy, dur, r=2, fill=LINE))
    for k in range(2):
        seg = rect(f"Progress {k + 1}", x, y0 + k * dy, 4, dy, dur, r=2, fill=BLUE, anchor=[0, -dy / 2])
        t = ws(steps[k + 1][1]) - 0.35
        seg["scale"] = K([(t, [100, 0], "inout"), (t + 0.35, [100, 100])], t0)
        content.append(seg)
    for k, (lab, wi) in enumerate(steps):
        cy = y0 + k * dy
        t = ws(wi)
        ring = ellipse(f"Node {k + 1}", x, cy, 30, 30, dur, fill=WHITE, stroke=LINE, sw=3)
        fill = ellipse(f"Node {k + 1} fill", x, cy, 30, 30, dur, fill=BLUE)
        appear_scale(fill, t, t0, s0=0, dur=0.35)
        chk = check_icon(f"Node {k + 1} check", x, cy, dur, 0.8, sw=3)
        chk["opacity"] = K([(t + 0.12, 0), (t + 0.3, 100)], t0)
        txt = text(f"Step {k + 1}", lab, x + 38, cy + 9, "Inter-Bold", 26, NAVY, dur, tracking=-10)
        appear(txt, t, t0, dx=-10, dy=0)
        content += [ring, fill, chk, txt]
    c = card("c09", "C09 Journey stepper", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", ws(107), 33.95, t0, dur)]


# =================================================================================
# M10  "I want to give you this book completely free. You just cover the shipping cost. But this free is for a limited time."
# =================================================================================
def m10(t0, dur):
    h = 430
    content = [
        appear(eyebrow("Eyebrow", "For you", 36, 54, dur), ws(119), t0, dy=8),
        rect("Thumb stage", 76, 134, 80, 96, dur, r=14, fill=SOFT),
        L("image", "Book thumb", 0, dur, asset="book", position=[76, 134], scale=[8.2, 8.2]),
        text("Item", "#CASHTAGS", 132, 128, "Inter-Bold", 24, NAVY, dur, tracking=-10),
        text("Item sub", "The book", 132, 156, "Inter-Medium", 18, SLATE, dur),
        text("Free", "Free", 424, 146, "Inter-ExtraBold", 40, BLUE, dur, justify="right", tracking=-20),
        rect("Divider 1", 230, 206, 388, 1.5, dur, fill=LINE),
        text("Shipping", "Shipping cost", 36, 258, "Inter-Medium", 22, NAVY, dur),
        text("Shipping value", "You cover it", 424, 258, "Inter-SemiBold", 22, SLATE, dur, justify="right"),
        rect("Divider 2", 230, 296, 388, 1.5, dur, fill=LINE),
        rect("Badge", 36 + 100, 356, 200, 52, dur, r=26, fill=BLUE_TINT),
        ellipse("Timer track", 36 + 30, 356, 24, 24, dur, stroke=BLUE_MID, sw=3.5),
        ellipse("Timer", 36 + 30, 356, 24, 24, dur, stroke=BLUE, sw=3.5),
        text("Badge label", "Limited time", 36 + 52, 363, "Inter-SemiBold", 20, BLUE, dur),
    ]
    for k in (1, 2, 3, 4):
        appear(content[k], ws(125) + 0.05 * k, t0, dy=10)
    appear(content[5], ws(128), t0, dy=0, scale=70, blur=8, dur=0.4)
    for k in (7, 8):
        appear(content[k], ws(133), t0, dy=10)
    for k in (10, 11, 13):
        appear(content[k], ws(139), t0, dy=10)
    tm = content[12]
    appear(tm, ws(139), t0, dy=10)
    tm["lineCap"] = "round"
    tm["trim"] = {"start": 0, "end": K([(ws(141), 100, "linear"), (ws(141) + 1.0, 8)], t0)}
    c = card("c10", "C10 Free copy summary", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", ws(119), 41.25, t0, dur)]


# =================================================================================
# M11  "Either you have watched a podcast or a webinar or a masterclass or some YouTube video.
#       You never started your journey in a structured way."
# =================================================================================
def icon(kind, cx, cy, dur, name):
    lays = []
    if kind == "podcast":
        lays.append(rect(f"{name} mic", cx, cy - 6, 14, 24, dur, r=7, stroke=BLUE, sw=3))
        lays.append(path(f"{name} stand", [P([(cx - 11, cy - 2), (cx, cy + 12), (cx + 11, cy - 2)],
                                             False, [(0, 0), (-9, 0), (0, 9)], [(0, 9), (9, 0), (0, 0)]),
                                           P([(cx, cy + 12), (cx, cy + 18)])], dur, stroke=BLUE, sw=3))
    elif kind == "webinar":
        lays.append(rect(f"{name} screen", cx, cy - 3, 32, 22, dur, r=4, stroke=BLUE, sw=3))
        lays.append(path(f"{name} stand", [P([(cx, cy + 8), (cx, cy + 14)]), P([(cx - 8, cy + 15), (cx + 8, cy + 15)])],
                         dur, stroke=BLUE, sw=3))
    elif kind == "masterclass":
        lays.append(path(f"{name} cap", [P([(cx - 17, cy - 4), (cx, cy - 12), (cx + 17, cy - 4), (cx, cy + 4)], True),
                                         P([(cx - 9, cy), (cx - 9, cy + 9), (cx, cy + 13), (cx + 9, cy + 9), (cx + 9, cy)])],
                         dur, stroke=BLUE, sw=3))
    elif kind == "video":
        lays.append(rect(f"{name} frame", cx, cy, 32, 24, dur, r=7, stroke=BLUE, sw=3))
        lays.append(path(f"{name} play", [P([(cx - 4, cy - 6), (cx + 7, cy), (cx - 4, cy + 6)], True)], dur, fill=BLUE))
    return lays


def m11(t0, dur):
    h = 520
    content = [appear(eyebrow("Eyebrow", "You have watched", 36, 54, dur), ws(153), t0, dy=8)]
    tiles = [("Podcast", "podcast", 155), ("Webinar", "webinar", 158), ("Masterclass", "masterclass", 161),
             ("YouTube video", "video", 164)]
    tw_, th, gap, gx, gy = 186, 150, 16, 36, 88
    tile_layers = []
    for k, (lab, kind, wi) in enumerate(tiles):
        col, row = k % 2, k // 2
        x0, y0 = gx + col * (tw_ + gap), gy + row * (th + gap)
        t = ws(wi)
        group = [rect(f"Tile {lab}", x0 + tw_ / 2, y0 + th / 2, tw_, th, dur, r=20, fill=SOFT)]
        group[0]["fillOpacity"] = 100
        group += [ellipse(f"Tile {lab} icon bg", x0 + 44, y0 + 46, 52, 52, dur, fill=WHITE)]
        group += icon(kind, x0 + 44, y0 + 46, dur, f"Tile {lab}")
        group.append(text(f"Tile {lab} label", lab, x0 + 20, y0 + 120, "Inter-Bold", 21, NAVY, dur, tracking=-10))
        for g in group:
            if g["type"] == "path":
                g["opacity"] = K([(t + 0.05, 0), (t + 0.35, 100)], t0)
            elif "position" in g:
                appear(g, t, t0, dy=12, dur=0.4)
        tile_layers += group
        # dim all tiles when "never" is said
        for g in group:
            o = g["opacity"]["k"]
            o.append([fr(ws(167) - t0), 100, "soft"])
            o.append([fr(ws(167) + 0.45 - t0), 40, "out"])
    content += tile_layers
    by = 88 + 2 * th + gap + 32
    content.append(rect("Banner", 230, by + 22, 388, 56, dur, r=16, fill=BLUE_TINT))
    content.append(ellipse("Banner icon", 64, by + 22, 22, 22, dur, stroke=BLUE, sw=3))
    content.append(path("Banner icon slash", [P([(57, by + 29), (71, by + 15)])], dur, stroke=BLUE, sw=3))
    content.append(text("Banner text", "Never started in a structured way", 86, by + 29, "Inter-SemiBold", 20, NAVY, dur, tracking=-5))
    for g in content[-4:]:
        if g["type"] == "path":
            g["opacity"] = K([(ws(170), 0), (ws(170) + 0.3, 100)], t0)
        else:
            appear(g, ws(170), t0, dy=10)
    c = card("c11", "C11 Where you learned", h, dur, content)
    return [card_layer(c, LANE_L, 140 + h / 2, "L", ws(150), 49.6, t0, dur)]


# =================================================================================
# M12  "so many influencers and YouTubers showing you different strategies on crypto, options, etc."
# M13  "something which can cut through the noise and give you a simple system."
# =================================================================================
def m12(t0, dur):
    h = 600
    content = [appear(eyebrow("Eyebrow", "Influencers & YouTubers", 36, 54, dur), ws(180), t0, dy=8)]
    tags = {1: ("Crypto", 188), 3: ("Options", 189), 4: ("+ more", 190)}
    item_t = [ws(180), ws(180) + 0.45, ws(182), ws(183), ws(185)]
    cut_t = ws(197)
    for k in range(5):
        cy = 120 + k * 96
        t = item_t[k]
        grp = [
            rect(f"Post {k + 1}", 230, cy, 388, 84, dur, r=18, fill=WHITE, stroke=LINE, sw=1.5, shadow=SMALL_SHADOW),
            ellipse(f"Post {k + 1} avatar", 70, cy, 40, 40, dur, fill=BLUE_TINT if k % 2 else LINE),
            rect(f"Post {k + 1} line 1", 98 + 80, cy - 11, 160, 10, dur, r=5, fill=LINE),
            rect(f"Post {k + 1} line 2", 98 + 55, cy + 11, 110, 10, dur, r=5, fill=SOFT),
        ]
        if k in tags:
            lab, wi = tags[k]
            cwid = tw(lab, "Inter-SemiBold", 17) + 28
            chip = rect(f"Post {k + 1} tag", 406 - cwid / 2, cy, cwid, 34, dur, r=17, fill=BLUE)
            ctext = text(f"Post {k + 1} tag label", lab, 406 - cwid / 2, cy + 6, "Inter-SemiBold", 17, WHITE, dur, justify="center")
            appear_scale(chip, ws(wi), t0, s0=70)
            appear(ctext, ws(wi) + 0.03, t0, dy=0)
            grp += [chip, ctext]
        for g in grp[:4]:
            appear(g, t, t0, dy=-18, dur=0.4)
        # cut through the noise: everything falls away, staggered
        to = cut_t + 0.25 + k * 0.06
        for g in grp:
            g["opacity"]["k"] += [[fr(to - t0), 100, "in"], [fr(to + 0.35 - t0), 0, "out"]]
            x, y = g["position"]["k"][-1][1] if isinstance(g["position"], dict) else g["position"]
            pk = g["position"]["k"] if isinstance(g["position"], dict) else [[fr(0), [x, y], "hold"]]
            pk += [[fr(to - t0), [x, y], "in"], [fr(to + 0.35 - t0), [x, y + 40], "out"]]
            g["position"] = {"k": pk}
        content += grp
    eb = content[0]
    eb["opacity"]["k"] += [[fr(cut_t + 0.2 - t0), 100, "in"], [fr(cut_t + 0.5 - t0), 0, "out"]]
    # the cut
    content.append(path("Cut line", [P([(16, 300), (444, 270)])], dur, stroke=BLUE, sw=5,
                        trim={"start": K([(cut_t + 0.18, 0, "in"), (cut_t + 0.5, 100)], t0),
                              "end": K([(cut_t, 0), (cut_t + 0.3, 100)], t0)}))
    # simple system
    t = ws(205)
    sc = ellipse("System check bg", 230, 228, 96, 96, dur, fill=BLUE)
    appear_scale(sc, t - 0.05, t0, s0=0, dur=0.45)
    ck = check_icon("System check", 230, 228, dur, 2.2, sw=7)
    ck["trim"] = {"start": 0, "end": K([(t + 0.15, 0), (t + 0.5, 100)], t0)}
    t1 = text("System title", "A simple system", 230, 340, "Inter-ExtraBold", 42, NAVY, dur, justify="center", tracking=-20)
    t2 = text("System sub", "Cut through the noise", 230, 384, "Inter-Medium", 22, SLATE, dur, justify="center")
    appear(t1, t, t0, dy=14, blur=6)
    appear(t2, t + 0.12, t0, dy=10)
    content += [sc, ck, t1, t2]
    c = card("c12", "C12 Noise to simple system", h, dur, content)
    return [card_layer(c, LANE_R, 140 + h / 2, "R", ws(180) - 0.05, 60.42, t0, dur)]


# =================================================================================
# M14  End card -- "That's where this book will help you."
# =================================================================================
def m14(t0, dur):
    h = 600
    t_in = ws(207)
    content = [
        rect("Cover stage", 230, 236, 388, 390, dur, r=22, fill=SOFT),
        L("image", "Book cover 3D", 0, dur, asset="book", position=[232, 238], scale=[33, 33]),
        text("Title", "#CASHTAGS", 36, 488, "Inter-Black", 46, NAVY, dur, tracking=-20),
        text("Offer", "Free · you just cover shipping", 36, 530, "Inter-SemiBold", 21, BLUE, dur),
        text("Help", "This book will help you", 36, 562, "Inter-Medium", 19, SLATE, dur),
    ]
    appear(content[1], t_in + 0.15, t0, dy=20, dur=0.6)
    appear(content[2], t_in + 0.3, t0, dy=12, blur=6)
    appear(content[3], t_in + 0.42, t0, dy=10)
    appear(content[4], ws(211), t0, dy=10)
    c = card("c14", "C14 End card", h, dur, content)
    return [card_layer(c, LANE_L, 140 + h / 2, "L", t_in, None, t0, dur)]


# =================================================================================
# Captions (bottom centre, clear of face, cards and the held-up book)
# =================================================================================
CAP_FONT, CAP_SIZE, CAP_TRACK = "Inter-SemiBold", 36, -5
CAP_MAXW = 760


def captions():
    groups = [list(g) for g in _tr["groups"]]
    right = [list(g) for g in _tr.get("right_groups", [])]
    # split any group whose line would not fit the strip
    out = []
    for a, b in groups:
        s = " ".join(w["text"] for w in WORDS[a:b + 1])
        if tw(s, CAP_FONT, CAP_SIZE, CAP_TRACK) > CAP_MAXW - 56 and b > a:
            m = (a + b) // 2
            out += [[a, m], [m + 1, b]]
        else:
            out.append([a, b])
    layers = []
    for gi, (a, b) in enumerate(out):
        s = " ".join(w["text"] for w in WORDS[a:b + 1])
        start = ws(a)
        last_end = WORDS[b]["end"] if WORDS[b]["end"] > start else start + 0.4
        nxt = ws(out[gi + 1][0]) if gi + 1 < len(out) else DUR
        end = min(last_end + 0.35, nxt) if nxt - last_end > 0.6 else nxt
        end = min(end, DUR)
        wpx = tw(s, CAP_FONT, CAP_SIZE, CAP_TRACK)
        pill_w = wpx + 56
        is_right = [a, b] in right or any(a >= r[0] and b <= r[1] for r in right)
        cx = (1000 + pill_w / 2) if is_right else 920
        cy = 984
        pill = L("rect", f"Cap {gi + 1:02d} pill", fr(start), fr(end), size=[round(pill_w, 1), 64], radius=22,
                 fill=NAVY, fillOpacity=88, position=[cx, cy])
        txt = L("text", f"Cap {gi + 1:02d}", fr(start), fr(end), text=s, font=CAP_FONT, size=CAP_SIZE, color=WHITE,
                justify="center", tracking=CAP_TRACK, position=[cx, cy + 13],
                karaoke={"dim": DIM, "times": [fr(ws(i)) for i in range(a, b + 1)]})
        for lay in (pill, txt):
            x, y = lay["position"]
            lay["opacity"] = K([(start, 0), (start + 0.18, 100)] + ([(end - 0.18, 100, "in"), (end, 0)] if end - start > 0.6 and end < nxt - 0.02 else []))
            lay["position"] = K([(start, [x, y + 10]), (start + 0.22, [x, y])])
        layers += [pill, txt]
    return comp("captions", "Captions (English)", "02 Moments", W, H, DUR, layers, bg=NAVY)


# =================================================================================
# A-roll + camera
# =================================================================================
def aroll():
    lays = []
    for k, (o_in, o_out, s_in) in enumerate(SEG):
        lays.append(L("footage", f"VSL take {k + 1} (source {s_in:.2f}s)", fr(o_in), fr(o_out), asset="vsl",
                      start=round(o_in - s_in, 4), audio=True, audioLevels=0))
    return comp("aroll", "A-Roll (edited)", "01 Main", W, H, DUR, lays, bg=NAVY)


SPLIT_POS, SPLIT_SCALE = [1410.2, 359.3], 82
SPLIT_MASK = [361, 15, 1459, 1064]
FULL_MASK = [-80, -80, 2000, 1160]


def camera_layer():
    """A-roll comp layer: slow push-ins, jump-cut punch-ins on key words, and the split screen."""
    a = ws(73)          # "It helps" -> split
    b = 25.30           # back to full before "And now it's available"
    sc = [  # (t, scale, ease)
        (0.0, 100, "linear"), (ws(32) - 1 / FPS, 102, "hold"), (ws(32), 107, "linear"),
        (ws(34) - 1 / FPS, 108, "hold"), (ws(34), 100, "linear"),
        (ws(56) - 1 / FPS, 102, "hold"), (ws(56), 105, "linear"),
        (a, 106.5, "inout"), (a + 0.8, SPLIT_SCALE, "hold"), (b, SPLIT_SCALE, "inout"), (b + 0.8, 100, "linear"),
        (SEG[1][0] - 1 / FPS, 102, "hold"), (SEG[1][0], 104, "linear"),
        (ws(127) - 1 / FPS, 105, "hold"), (ws(127), 109, "linear"),
        (ws(129) - 1 / FPS, 110, "hold"), (ws(129), 100, "linear"),
        (SEG[2][0] - 1 / FPS, 102.5, "hold"), (SEG[2][0], 104, "linear"),
        (ws(175) - 1 / FPS, 105.5, "hold"), (ws(175), 100, "linear"),
        (ws(191) - 1 / FPS, 102, "hold"), (ws(191), 104, "linear"),
        (ws(207) - 1 / FPS, 106, "hold"), (ws(207), 100, "linear"),
        (DUR, 101.5, "linear"),
    ]
    scale = K([(t, [v, v], e) for t, v, e in sc])
    pos = K([(a, [910, 380], "inout"), (a + 0.8, SPLIT_POS, "hold"), (b, SPLIT_POS, "inout"), (b + 0.8, [910, 380])])
    mask = {"rect": K([(a, FULL_MASK, "inout"), (a + 0.8, SPLIT_MASK, "hold"), (b, SPLIT_MASK, "inout"), (b + 0.8, FULL_MASK)]),
            "radius": 44}
    return L("comp", "A-Roll (edited)", 0, DUR, comp="aroll", start=0, anchor=[910, 380], position=pos,
             scale=scale, mask=mask, shadow={"color": NAVY, "opacity": 18, "direction": 180, "distance": 20, "softness": 60})


# =================================================================================
# Audio
# =================================================================================
SFX = []


def sfx(asset, t, db):
    SFX.append((asset, t, db))


def audio_comp():
    lays = [L("audio", "Music bed (original)", 0, DUR, asset="music", start=0,
              audioLevels=K([(0, -40), (0.8, -28, "linear"), (DUR - 0.9, -28, "soft"), (DUR, -48)]))]
    dur_of = {"whoosh": 0.57, "click": 0.37, "pop": 0.72}
    for k, (asset, t, db) in enumerate(sorted(SFX, key=lambda s: s[1])):
        t_in = fr(t)
        t_out = min(round(t_in + math.floor(dur_of[asset] * FPS) / FPS, 4), fr(DUR))
        lays.append(L("audio", f"SFX {k + 1:02d} {asset}", t_in, t_out, asset=asset, start=t_in, audioLevels=db))
    return comp("audio", "Music + SFX", "06 Audio", W, H, DUR, lays, bg=NAVY)


# =================================================================================
def main():
    MOMENTS = [
        ("m01", "M01 Name lower third", 0.3, 4.3, m01, "Hi, my name is Vishal."),
        ("m02", "M02 Structured vs guessing", 1.45, 7.1, m02, "money from the stock market in a structured way rather than guessing"),
        ("m03", "M03 Book reveal", 6.7, 11.6, m03, "then I have this book for you called #CASHTAGS."),
        ("m04", "M04 Written in 2019", 9.55, 11.7, m04, "This is the book I wrote in 2019,"),
        ("m05", "M05 Readers and 5-star reviews", 11.5, 15.85, m05, "thousands of people have read this book and given 5-star reviews on Amazon,"),
        ("m06", "M06 Programs and awards", 15.6, 21.0, m06, "joined the programs and got 6-figure, 7-figure, 8-figure awards on my stage."),
        ("m07", "M07 Split screen: guessing to systematic", 20.9, 25.8, m07, "go from random guessing work to become a systematic trader."),
        ("m08", "M08 Second edition, English and Hindi", 25.4, 31.15, m08, "now it's available in a second edition ... English and Hindi as well."),
        ("m09", "M09 Trading journey stepper", 31.1, 34.5, m09, "You can read this book and get started on your trading journey."),
        ("m10", "M10 Free copy, shipping, limited time", 34.3, 41.7, m10, "give you this book completely free. You just cover the shipping cost ... limited time."),
        ("m11", "M11 Podcast, webinar, masterclass, YouTube", 42.5, 50.05, m11, "watched a podcast or a webinar or a masterclass or some YouTube video ... never started"),
        ("m12", "M12-13 Noise feed, cut to a simple system", 50.4, 60.85, m12, "influencers and YouTubers ... crypto, options, etc. ... cut through the noise ... a simple system."),
        ("m14", "M14 End card", 60.6, DUR, m14, "That's where this book will help you."),
    ]
    # SFX cues (card entrances, pops on word-synced reveals)
    for t in [ws(1), ws(5), ws(25), ws(34), ws(42), ws(56), ws(73), ws(88) + 0.15, ws(107), ws(119), ws(150), ws(180), ws(207)]:
        sfx("whoosh", t - 0.12, -24)
    for wi in [52, 66, 67, 68, 102, 104, 109, 113, 117, 128, 155, 158, 161, 164, 188, 189, 205]:
        sfx("click", ws(wi), -21)
    sfx("pop", ws(33), -24)

    bg = L("rect", "Stage background", 0, DUR, size=[W, H], radius=0, fill=STAGE, position=[W / 2, H / 2])
    ar = aroll()
    MAIN_LAYERS.append(bg)
    MAIN_LAYERS.append(camera_layer())
    for mid, name, a, b, fn, marker in MOMENTS:
        moment(mid, name, a, b, fn, marker)
    cap = captions()
    MAIN_LAYERS.append(L("comp", "Captions (English)", 0, DUR, comp="captions", start=0))
    au = audio_comp()
    MAIN_LAYERS.insert(0, L("comp", "Music + SFX", 0, DUR, comp="audio", start=0))
    # order: children first
    ordered = [ar] + [c for c in COMPS if c["id"] not in ("aroll", "captions", "audio")] + [cap, au]
    main_c = {"id": "main", "name": "CASHTAGS_VSL_Main", "folder": "01 Main", "width": W, "height": H,
              "duration": fr(DUR), "bg": NAVY, "layers": MAIN_LAYERS}
    spec = {
        "version": 1, "name": "CASHTAGS_VSL", "fps": FPS, "main": "main",
        "folders": ["01 Main", "02 Moments", "03 Cards", "04 Footage", "05 Images", "06 Audio"],
        "assets": [
            {"id": "vsl", "type": "footage", "file": "Footage/VSL.mp4", "preview": "assets/footage/VSL.mp4",
             "width": 1920, "height": 1080, "duration": 76.81, "folder": "04 Footage"},
            {"id": "book", "type": "image", "file": "Images/book-3d.png", "preview": "assets/images/book-3d.png",
             "width": 824, "height": 1120, "folder": "05 Images"},
            {"id": "music", "type": "audio", "file": "Audio/music-bed.mp3", "preview": "assets/audio/music-bed.mp3",
             "duration": 62.83, "folder": "06 Audio"},
            {"id": "whoosh", "type": "audio", "file": "Audio/whoosh-short.mp3", "preview": "assets/audio/whoosh-short.mp3",
             "duration": 0.57, "folder": "06 Audio"},
            {"id": "click", "type": "audio", "file": "Audio/click-soft.mp3", "preview": "assets/audio/click-soft.mp3",
             "duration": 0.37, "folder": "06 Audio"},
            {"id": "pop", "type": "audio", "file": "Audio/pop.mp3", "preview": "assets/audio/pop.mp3",
             "duration": 0.72, "folder": "06 Audio"},
        ],
        "comps": ordered + [main_c],
        "render": {"comp": "main", "output": "CASHTAGS_VSL_1080p30"},
        "markers": MARKERS,
    }
    json.dump(spec, open(os.path.join(ROOT, "spec.json"), "w"), indent=1)
    n = sum(len(c["layers"]) for c in spec["comps"])
    print(f"spec.json: {len(spec['comps'])} comps, {n} layers, {len(MARKERS)} markers, duration {fr(DUR)} s")


if __name__ == "__main__":
    main()
