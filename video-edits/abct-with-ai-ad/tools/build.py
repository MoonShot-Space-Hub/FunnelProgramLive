"""Builds the edit plan: cuts.json (camera), captions.ass (captions + motion graphics), sfx.wav (sound design)."""
import json, re, sys, wave
import numpy as np
from PIL import ImageFont

OUT = sys.argv[1]
SFX = f"{OUT}/sfx"
DUR = 35.73
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"

# ---------------------------------------------------------------- camera cuts
# (time, zoom, flash/shake)  ~1.7s average shot length, alternating wide/medium/close
CUTS = [(0.00, 1.60, 1), (0.95, 1.20, 0), (2.05, 1.75, 0), (3.32, 1.00, 0), (5.12, 1.65, 1),
        (6.44, 1.20, 0), (7.95, 1.85, 1), (8.67, 1.00, 0), (10.75, 1.35, 0), (12.36, 1.15, 0),
        (13.75, 1.75, 0), (15.38, 1.05, 0), (16.98, 1.45, 0), (18.40, 1.15, 0), (20.00, 1.85, 1),
        (23.04, 1.00, 0), (25.50, 1.35, 0), (28.37, 1.70, 0), (29.95, 1.20, 0), (32.88, 1.60, 1),
        (34.20, 1.90, 0)]
json.dump(CUTS, open(f"{OUT}/cuts.json", "w"))

# ---------------------------------------------------------------- captions
# (start, text) — *word* = highlighted keyword. Each chunk ends where the next begins.
CAPS = [
    (0.05, "A strategy I've been"), (0.95, "teaching for *19 years*"), (2.05, "learned by *2.5 lakh* people"),
    (3.32, "And I've recorded it"), (4.25, "just for you"), (5.12, "*FREE* — in just *1 hour*"),
    (6.44, "Click and watch it"), (6.95, "*right away*"), (7.44, "and that too..."), (7.95, "*absolutely FREE*"),
    (8.67, "Something you'd usually get"), (9.65, "only in our *paid programs*"),
    (10.75, "Now, it's not like"), (11.50, "watching this strategy"),
    (12.36, "you'll start *making money* instantly"), (13.75, "or become a *crorepati* tomorrow"),
    (15.38, "But you'll understand"), (16.20, "how the *market* works"), (16.98, "how the *system* works"),
    (18.30, "and what *systematic trading* is"),
    (20.00, "So *click the link*"), (20.90, "and check out this video"), (21.85, "*right now!*"),
    (22.40, "And along with that,"), (23.04, "on the next page"), (24.20, "a *4-day ABCT*"),
    (25.50, "you'll get a chance to *attend*"), (26.90, "*ABCT With AI*"),
    (28.37, "*3 days* of ABCT"), (29.20, "+ *1 AI tool*"), (29.95, "that makes this strategy"),
    (31.30, "*even easier*"), (32.88, "So *watch this strategy* now"), (34.20, "*click the link*"),
    (34.95, "and I'll see you *inside!*"),
]

W, H = 1080, 1920
YEL, WHT, BLK, RED, GRN = "&H0000D4FF&", "&H00FFFFFF&", "&H00000000&", "&H003030F0&", "&H0055D46B&"


def ts(t):
    t = max(0, t); cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def text_w(s, size):
    f = ImageFont.truetype(FONT, 200)
    asc, desc = f.getmetrics()
    eff = size * 200 / (asc + desc)  # libass sizes fonts by ascent+descent, not em
    return ImageFont.truetype(FONT, 200).getlength(s) * eff / 200


def rrect(w, h, r):
    """ASS vector path for a rounded rectangle with top-left at (0,0)."""
    k = r * 0.45
    return (f"m {r} 0 l {w - r} 0 b {w - k} 0 {w} {k} {w} {r} l {w} {h - r} b {w} {h - k} {w - k} {h} {w - r} {h} "
            f"l {r} {h} b {k} {h} 0 {h - k} 0 {h - r} l 0 {r} b 0 {k} {k} 0 {r} 0")


ev = []


def add(layer, t0, t1, style, txt):
    ev.append(f"Dialogue: {layer},{ts(t0)},{ts(t1)},{style},,0,0,0,,{txt}")


POP = r"\fscx70\fscy70\t(0,90,\fscx108\fscy108)\t(90,170,\fscx100\fscy100)"

# captions: lower-middle, white with heavy outline, keywords yellow & bigger
for i, (t0, txt) in enumerate(CAPS):
    t1 = CAPS[i + 1][0] if i + 1 < len(CAPS) else DUR
    body = re.sub(r"\*(.+?)\*", lambda m: r"{\c" + YEL + r"\fs88}" + m.group(1) + r"{\c" + WHT + r"\fs78}", txt)
    add(5, t0, t1, "Cap", r"{\an5\pos(540,1340)" + POP + "}" + body)


def chip(t0, t1, x, y, label, size=60, fg=BLK, bg=WHT, rot=0, slam=False, pad=(34, 18), layer=10):
    """Rounded box + text that pops/slides in, fades out."""
    tw = text_w(label, size); bw, bh = tw + 2 * pad[0], size * 1.18 + 2 * pad[1] - 10
    anim = (r"\fscx250\fscy250\t(0,110,\fscx92\fscy92)\t(110,180,\fscx100\fscy100)" if slam
            else r"\fscx60\fscy60\t(0,110,\fscx106\fscy106)\t(110,190,\fscx100\fscy100)")
    common = rf"\an5\move({x},{y + 30},{x},{y},0,140)\fad(90,140)\frz{rot}{anim}"
    # drop shadow, box, text
    add(layer, t0, t1, "Shape", "{" + common + rf"\org({x},{y})\1c{BLK}\1a&H90&\blur6\pos({x + 6},{y + 8})" + "}"
        + "{\\p1}" + rrect(bw, bh, 22) + "{\\p0}")
    add(layer + 1, t0, t1, "Shape", "{" + common + rf"\1c{bg}" + "}" + "{\\p1}" + rrect(bw, bh, 22) + "{\\p0}")
    add(layer + 2, t0, t1, "Box", "{" + common + rf"\fs{size}\1c{fg}" + "}" + label)
    return bw, bh


def counter(t0, t1, x, y, fmt, end, label, steps=14, spin=0.45):
    """Count-up number with label chip underneath."""
    for k in range(steps + 1):
        a = t0 + spin * k / steps; b = t0 + spin * (k + 1) / steps if k < steps else t1
        v = end * (1 - (1 - k / steps) ** 2)
        pop = POP if k == 0 else (r"\t(0,80,\fscx112\fscy112)\t(80,160,\fscx100\fscy100)" if k == steps else "")
        add(12, a, b, "Num", rf"{{\an5\pos({x},{y}){pop}\fad(0,{140 if k == steps else 0})}}" + fmt(v))
    chip(t0 + 0.12, t1, x, y + 120, label, size=46)


# ---- motion graphics (top third, above the head)
counter(0.95, 2.02, 540, 175, lambda v: f"{int(round(v))}", 19, "YEARS OF TEACHING")
counter(2.05, 3.30, 540, 175, lambda v: f"{v:.1f} LAKH+", 2.5, "PEOPLE HAVE LEARNED IT")
chip(5.12, 6.40, 540, 230, "FREE", size=120, fg=BLK, bg=YEL, rot=-6, slam=True)
chip(5.60, 6.40, 540, 380, "1-HOUR RECORDED SESSION", size=44)
chip(7.95, 8.65, 540, 240, "100% FREE", size=100, fg=WHT, bg=GRN, rot=4, slam=True)
chip(9.65, 10.72, 540, 240, "USUALLY ONLY IN PAID PROGRAMS", size=46)
# "overnight crorepati" with an animated red strike-through
bw, bh = chip(13.75, 15.36, 540, 240, "OVERNIGHT CROREPATI?", size=62)
x0, x1 = 540 - bw / 2 + 20, 540 + bw / 2 - 20
add(14, 14.35, 15.36, "Shape", rf"{{\an7\pos({x0},{232})\1c{RED}\fad(0,140)\clip({x0},0,{x0},1920)"
    rf"\t(0,220,\clip({x0},0,{x1 + 5},1920))\frz-3}}" + "{\\p1}" + rrect(x1 - x0, 16, 8) + "{\\p0}")
add(14, 14.35, 15.36, "Num", rf"{{\an5\pos({x1 + 30},{150})\fs110\1c{RED}\fad(0,140)" + POP + "}✗")
# market -> system -> systematic trading
chip(16.20, 19.98, 360, 190, "MARKET", size=52)
add(13, 16.98, 19.98, "Num", rf"{{\an5\pos(545,190)\fs64\1c{YEL}\fad(80,140)" + POP + "}→")
chip(16.98, 19.98, 730, 190, "SYSTEM", size=52)
chip(18.40, 19.98, 540, 315, "SYSTEMATIC TRADING", size=56, fg=BLK, bg=YEL, slam=True)
# CTA 1
chip(20.00, 23.00, 540, 230, "CLICK THE LINK", size=84, fg=BLK, bg=YEL, rot=-3, slam=True)
# program card
chip(24.20, 29.92, 540, 200, "4-DAY ABCT WITH AI", size=72, fg=WHT, bg="&H00D07A1E&", slam=True)
chip(28.37, 29.92, 380, 330, "3 DAYS ABCT", size=48)
add(13, 29.20, 29.92, "Num", rf"{{\an5\pos(585,330)\fs64\1c{YEL}\fad(80,140)" + POP + "}+")
chip(29.20, 29.92, 760, 330, "1 AI TOOL", size=48, fg=BLK, bg=YEL)
chip(30.00, 32.85, 540, 230, "EVEN EASIER", size=80, fg=WHT, bg=GRN, rot=-3, slam=True)
# final CTA
chip(32.88, DUR, 540, 210, "WATCH IT NOW", size=84, fg=BLK, bg=YEL, slam=True)
chip(34.20, DUR, 540, 345, "LINK IS RIGHT HERE", size=50)

# bouncing arrow toward the CTA button below the video
ARROW = "m 0 0 l 70 0 l 70 70 l 120 70 l 35 160 l -50 70 l 0 70"
for t0, t1 in [(20.2, 23.0), (34.2, DUR)]:
    t, down = t0, True
    while t < t1 - 0.02:
        b = min(t + 0.25, t1); ya, yb = (1560, 1610) if down else (1610, 1560)
        add(9, t, b, "Shape", rf"{{\an7\1c{YEL}\3c{BLK}\bord6\move(505,{ya},505,{yb})"
            + (r"\fad(120,0)" if t == t0 else "") + "}{\\p1}" + ARROW + "{\\p0}")
        t, down = b, not down

head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Display Black,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,7,4,5,40,40,0,1
Style: Box,Inter Display Black,60,&H00000000,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: Num,Inter Display Black,150,&H0000D4FF,&H0000D4FF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,8,5,5,0,0,0,1
Style: Shape,Inter Display Black,10,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(f"{OUT}/captions.ass", "w").write(head + "\n".join(ev) + "\n")

# ---------------------------------------------------------------- sound design
SR = 48000


def load(n):
    w = wave.open(f"{SFX}/{n}.wav"); x = np.frombuffer(w.readframes(w.getnframes()), np.int16)
    return x.reshape(-1, 2).astype(float) / 32768


S = {n: load(n) for n in ["whoosh", "riser", "pop", "tick", "impact", "ding"]}
track = np.zeros((int((DUR + 2) * SR), 2))


def put(n, t, g, end_at=False):
    x = S[n]; i = int((t - (len(x) / SR if end_at else 0)) * SR); i = max(i, 0)
    track[i:i + len(x)] += x[:len(track) - i] * g


put("impact", 0.0, 0.45)
for c in range(1, len(CUTS)):  # whoosh into every big framing change, peak on the cut
    if abs(CUTS[c][1] - CUTS[c - 1][1]) >= 0.4: put("whoosh", CUTS[c][0] - 0.22, 0.30)
for t0 in (0.95, 2.05):  # counter ticks
    for k in range(10): put("tick", t0 + 0.045 * k, 0.28)
for t in (0.95, 2.05, 5.60, 9.65, 13.75, 16.20, 16.98, 18.40, 24.20, 28.37, 29.20, 30.00, 32.88, 34.20):
    put("pop", t, 0.45)
for t, g in ((5.12, 0.55), (7.95, 0.40), (20.0, 0.55), (32.88, 0.45)): put("impact", t, g)
put("whoosh", 14.30, 0.4)
put("riser", 20.0, 0.30, end_at=True); put("riser", 32.88, 0.30, end_at=True)
put("ding", 34.20, 0.35)
track = np.clip(track, -1, 1)
w = wave.open(f"{OUT}/sfx_track.wav", "w"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((track * 32767).astype(np.int16).tobytes()); w.close()
print("events", len(ev))
