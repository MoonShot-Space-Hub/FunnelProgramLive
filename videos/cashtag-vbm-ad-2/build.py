#!/usr/bin/env python3
"""Generate index.html for the Cashtag VBM ad 2 edit: A-roll + English captions + B-roll cutaways + music.

Edit CAPTIONS / BROLL / OVERLAYS / PUNCHES below and re-run `python3 build.py`.
Captions follow the spoken English (Parakeet word onsets for timing, hand-corrected;
"hashtag" in the ASR is the book title, #Cashtags).
"""
import html, json, pathlib

DUR = 32.55
MUSIC = 0.08  # bed level; the automation lane is absolute, so it carries this value too

# (start, end, text, indices of highlighted words)
CAPTIONS = [
    (0.20, 1.50, "Why do 95% of people", [2]),
    (1.50, 2.85, "lose money in the stock market?", [0, 1]),
    (2.85, 3.65, "Because they trade", [2]),
    (3.65, 4.35, "without a system,", [2]),
    (4.35, 5.40, "without risk management,", [1, 2]),
    (5.40, 6.60, "without the right process.", [2, 3]),
    (6.60, 8.35, "And that's exactly what I've covered", [2]),
    (8.35, 10.00, "in my #Cashtags 2.0.", [2, 3]),
    (10.00, 11.10, "It's available", [1]),
    (11.10, 12.10, "in Hindi and English.", [1, 3]),
    (12.10, 12.90, "And you don't even need", []),
    (12.90, 13.45, "to read the book.", [1]),
    (13.45, 14.20, "You can join the", [2]),
    (14.20, 15.60, "free Intensive workshop.", [0, 1]),
    (15.60, 16.40, "It's a free workshop", [2, 3]),
    (16.40, 17.45, "on the book itself,", [2]),
    (17.45, 18.45, "where I'll teach you", []),
    (18.45, 19.30, "how to select a stock,", [2, 4]),
    (19.30, 20.45, "when to buy, when to sell,", [2, 5]),
    (20.45, 21.20, "when to exit,", [2]),
    (21.20, 22.10, "what the stop loss is,", [2, 3]),
    (22.10, 23.20, "what risk management is,", [1, 2]),
    (23.20, 24.25, "how to pick the right stock,", [4, 5]),
    (24.25, 25.45, "what the top-down approach is,", [2, 3]),
    (25.45, 26.55, "how to select the sector.", [4]),
    (26.55, 27.70, "All this in a 3-hour", [4]),
    (27.70, 29.60, "free Intensive workshop.", [0, 1]),
    (29.60, 30.65, "So click the link", [3]),
    (30.65, 31.75, "and book your seat right now", [1, 3, 4, 5]),
    (31.75, DUR, "for the event.", [2]),
]

# Full-screen B-roll cutaways: (id, start, end). Bodies are defined in BROLL_HTML.
BROLL = [
    ("b-stat", 0.55, 2.85),
    ("b-without", 3.60, 6.60),
    ("b-free", 13.45, 15.60),
    ("b-chart", 18.45, 22.10),
    ("b-topdown", 24.25, 26.55),
    ("b-hours", 26.55, 29.60),
    ("b-cta", 30.65, DUR),
]

# Overlays that sit on top of the A-roll without hiding him (top of frame, in the sky).
OVERLAYS = [("o-lang", 10.30, 12.40), ("o-title", 7.90, 10.00)]

# Punch-in zooms on the A-roll between cutaways: (start, end, scale)
PUNCHES = [(6.60, 7.90, 1.12), (12.10, 13.45, 1.12), (16.40, 18.45, 1.10), (22.10, 24.25, 1.14), (29.60, 30.65, 1.16)]


def esc(s):
    return html.escape(s, quote=True)


def candles():
    # deterministic uptrend candles for the chart cutaway (SVG units)
    closes = [500, 470, 486, 440, 404, 420, 372, 330, 352, 300, 262, 280, 222, 196]
    out, prev = [], 530
    for i, c in enumerate(closes):
        o, x = prev, 40 + i * 52
        hi, lo = min(o, c) - 18 - (i * 7) % 16, max(o, c) + 16 + (i * 5) % 14
        col = "#19b37a" if c < o else "#e2554f"
        top, h = min(o, c), max(4, abs(o - c))
        out.append(
            f'<g class="cdl"><line x1="{x + 17}" x2="{x + 17}" y1="{hi}" y2="{lo}" stroke="{col}" stroke-width="4"/>'
            f'<rect x="{x}" y="{top}" width="34" height="{h}" rx="4" fill="{col}"/></g>'
        )
        prev = c
    return "".join(out)


def level(lid, y, color, label, w=236):
    return (f'<g class="lvl" id="{lid}"><line x1="0" x2="900" y1="{y}" y2="{y}" stroke="{color}" stroke-width="5" stroke-dasharray="18 12"/>'
            f'<rect x="{900 - w}" y="{y - 34}" width="{w}" height="68" rx="14" fill="{color}"/>'
            f'<text x="{900 - w / 2}" y="{y + 12}" text-anchor="middle">{label}</text></g>')


def marker(mid, x, y, color, label):
    return (f'<g class="mk" id="{mid}"><circle cx="{x}" cy="{y}" r="22" fill="{color}" stroke="#fff" stroke-width="5"/>'
            f'<rect x="{x - 60}" y="{y - 92}" width="120" height="54" rx="12" fill="{color}"/>'
            f'<text x="{x}" y="{y - 53}" text-anchor="middle" class="mk-t">{label}</text></g>')


BROLL_HTML = {
    "b-stat": """
      <div class="stage">
        <div class="stat" id="st-num"><span id="st-val">0</span>%</div>
        <div class="kicker" id="st-k">of people lose money</div>
        <svg class="down" id="st-line" viewBox="0 0 800 220" width="800" height="220"><polyline points="0,30 120,60 220,40 340,110 450,90 560,160 680,140 800,205" fill="none" stroke="#e2554f" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/></svg>
      </div>""",
    "b-without": """
      <div class="stage">
        <div class="kicker">They trade without</div>
        <div class="list">
          <div class="item x" id="w-1"><span class="xmark">&times;</span><div><b>A system</b></div></div>
          <div class="item x" id="w-2"><span class="xmark">&times;</span><div><b>Risk management</b></div></div>
          <div class="item x" id="w-3"><span class="xmark">&times;</span><div><b>The right process</b></div></div>
        </div>
      </div>""",
    "b-free": """
      <div class="stage">
        <div class="ticket" id="ticket">
          <div class="t-label">On the book itself</div>
          <div class="t-free">FREE</div>
          <div class="t-sub">Intensive Workshop</div>
          <div class="t-tear"></div>
          <div class="t-foot">#Cashtags 2.0 &middot; Hindi &amp; English</div>
          <div class="shine" id="ticket-shine" data-layout-allow-overflow></div>
        </div>
      </div>""",
    "b-chart": f"""
      <div class="stage">
        <div class="kicker">In the workshop</div>
        <div class="chartbox">
          <svg class="cs" viewBox="0 0 900 620" width="900" height="620">
            {candles()}
            {level("lv-stop", 560, "#e2554f", "STOP LOSS", 296)}
            {marker("mk-buy", 113, 470, "#3d7bff", "BUY")}
            {marker("mk-sell", 633, 210, "#19b37a", "SELL")}
            {marker("mk-exit", 737, 196, "#ff9f1c", "EXIT")}
          </svg>
          <div class="pill small" id="c-pick"><span class="tickmini">&#10003;</span>Stock selection</div>
        </div>
      </div>""",
    "b-topdown": """
      <div class="stage">
        <div class="kicker" id="td-k">Top-down approach</div>
        <div class="funnel">
          <div class="tier t1" id="td-1">Market</div>
          <div class="tier t2" id="td-2">Sector</div>
          <div class="tier t3" id="td-3">Stock</div>
        </div>
      </div>""",
    "b-hours": """
      <div class="stage">
        <div class="clock" id="clk"><div class="hand" id="clk-hand"></div><b>3</b><small>hours</small></div>
        <div class="row">
          <div class="pill orange" id="hr-free">Free</div>
          <div class="pill" id="hr-int">Intensive</div>
        </div>
      </div>""",
    "b-cta": """
      <div class="stage">
        <div class="kicker" id="cta-k">Free 3-hour Intensive workshop</div>
        <div class="btn" id="cta-btn">Book your seat<div class="ripple" id="cta-ripple"></div></div>
        <div class="kicker under" id="cta-sub">Click the link below</div>
        <svg class="cursor" id="cta-cursor" viewBox="0 0 24 24" width="96" height="96"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b1020" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>""",
}

OVERLAY_HTML = {
    "o-lang": """<div class="chips"><div class="chip" id="ol-hi">Hindi</div><div class="chip amp" id="ol-amp">+</div><div class="chip" id="ol-en">English</div></div>""",
    "o-title": """<div class="titlecard" id="ot-card"><b>#CASHTAGS</b><span>2.0</span><small>Stock trading simplified</small></div>""",
}

CSS = """
@font-face { font-family: "Montserrat"; font-weight: 900; src: url(assets/fonts/montserrat-latin-900-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 800; src: url(assets/fonts/montserrat-latin-800-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 600; src: url(assets/fonts/montserrat-latin-600-normal.woff2) format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b1020; }
:root { --navy: #0b1020; --ink: #f5f7ff; --orange: #ff9f1c; --blue: #3d7bff; --green: #19b37a; --red: #e2554f; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Montserrat", sans-serif; color: var(--ink); }
#aroll-zoom { position: absolute; inset: 0; transform-origin: 50% 35%; }
#aroll { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* B-roll cutaways */
.broll { position: absolute; inset: 0; overflow: hidden; }
.broll .stage { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 160px 80px 760px; gap: 44px;
  background: radial-gradient(120% 70% at 50% 30%, #1d2a5c 0%, #0b1020 62%), #0b1020; }
.broll .stage::before { content: ""; position: absolute; inset: 0; opacity: .18;
  background-image: linear-gradient(#3a4a8a 1px, transparent 1px), linear-gradient(90deg, #3a4a8a 1px, transparent 1px);
  background-size: 90px 90px; }
.kicker { position: relative; font-weight: 800; font-size: 44px; letter-spacing: .14em; text-transform: uppercase; color: #8fb4ff; text-align: center; }
.kicker.under { color: #c9d2ff; font-size: 38px; }
.pill { position: relative; display: flex; align-items: center; gap: 20px; padding: 26px 56px; border-radius: 999px; font-weight: 900;
  font-size: 60px; text-transform: uppercase; background: rgba(255,255,255,.08); border: 3px solid rgba(255,255,255,.22); }
.pill.orange { background: var(--orange); border-color: var(--orange); color: #121838; }
.pill.small { font-size: 38px; padding: 16px 30px; }
.row { position: relative; display: flex; gap: 30px; }

.stat { position: relative; font-weight: 900; font-size: 330px; line-height: 1; color: var(--red); font-variant-numeric: tabular-nums; }
.down { position: relative; }

.list { position: relative; display: flex; flex-direction: column; gap: 30px; width: 900px; }
.item { display: flex; align-items: center; gap: 34px; padding: 32px 40px; border-radius: 32px; background: rgba(255,255,255,.08); border: 3px solid rgba(255,255,255,.2); }
.item b { display: block; font-weight: 900; font-size: 56px; white-space: nowrap; }
.xmark { flex: none; width: 92px; height: 92px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--red); color: #fff; font-size: 70px; font-weight: 900; line-height: 1; }

.ticket { position: relative; width: 820px; padding: 60px 60px 50px; border-radius: 40px; overflow: hidden; text-align: center;
  background: linear-gradient(150deg, #22306a, #121838); border: 5px solid var(--orange); box-shadow: 0 40px 120px rgba(0,0,0,.55); }
.t-label { font-weight: 800; font-size: 38px; letter-spacing: .18em; text-transform: uppercase; color: var(--orange); }
.t-free { font-weight: 900; font-size: 230px; line-height: 1; margin-top: 10px; color: var(--green); }
.t-sub { font-weight: 900; font-size: 60px; text-transform: uppercase; }
.t-tear { margin: 40px -60px 28px; border-top: 5px dashed rgba(255,159,28,.6); }
.t-foot { font-weight: 600; font-size: 34px; color: #c9d2ff; }
.shine { position: absolute; top: -20%; bottom: -20%; left: 0; width: 180px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); transform: skewX(-20deg); }

.chartbox { position: relative; width: 900px; height: 620px; border-radius: 30px; background: rgba(255,255,255,.05); border: 3px solid rgba(255,255,255,.15); }
.cs { position: absolute; inset: 0; overflow: visible; }
.cs text { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 36px; fill: #0b1020; }
.cs text.mk-t { fill: #fff; font-size: 32px; }
#c-pick { position: absolute; left: 30px; top: 30px; background: rgba(11,16,32,.85); }
.tickmini { display: inline-flex; width: 52px; height: 52px; border-radius: 50%; align-items: center; justify-content: center; background: var(--orange); color: #121838; font-size: 32px; }

.funnel { position: relative; display: flex; flex-direction: column; align-items: center; gap: 22px; }
.tier { display: flex; align-items: center; justify-content: center; height: 150px; border-radius: 26px; font-weight: 900; font-size: 64px; text-transform: uppercase; }
.t1 { width: 880px; background: #22306a; border: 3px solid #4a5ea8; }
.t2 { width: 680px; background: var(--blue); }
.t3 { width: 480px; background: var(--orange); color: #121838; }

.clock { position: relative; width: 360px; height: 360px; border-radius: 50%; border: 14px solid var(--orange); display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(255,255,255,.05); }
.clock b { font-weight: 900; font-size: 180px; line-height: .9; }
.clock small { font-weight: 800; font-size: 50px; text-transform: uppercase; color: #c9d2ff; }
.hand { position: absolute; left: 50%; top: 22px; width: 10px; height: 146px; margin-left: -5px; border-radius: 6px; background: #8fb4ff; transform-origin: 50% 100%; }

.btn { position: relative; overflow: hidden; padding: 48px 90px; border-radius: 999px; background: var(--orange); color: #121838;
  font-weight: 900; font-size: 74px; text-transform: uppercase; box-shadow: 0 30px 90px rgba(255,159,28,.4); }
.ripple { position: absolute; left: 70%; top: 60%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,.7); }
.cursor { position: absolute; left: 800px; top: 760px; }

/* Overlays on the A-roll (sky area, above his head) */
.ovl { position: absolute; left: 0; right: 0; top: 150px; height: 340px; display: flex; align-items: center; justify-content: center; }
.chips { display: flex; align-items: center; gap: 22px; }
.chip { padding: 26px 50px; border-radius: 999px; font-weight: 900; font-size: 64px; text-transform: uppercase; color: #121838;
  background: #fff; box-shadow: 0 16px 50px rgba(0,0,0,.35); }
.chip.amp { padding: 26px 30px; background: var(--orange); }
.titlecard { display: flex; flex-direction: column; align-items: center; padding: 34px 60px 30px; border-radius: 34px; background: rgba(11,16,32,.88);
  border: 4px solid var(--orange); box-shadow: 0 20px 60px rgba(0,0,0,.4); }
.titlecard b { font-weight: 900; font-size: 110px; line-height: 1; letter-spacing: -.01em; }
.titlecard span { font-weight: 900; font-size: 64px; color: var(--orange); margin-top: 6px; }
.titlecard small { font-weight: 800; font-size: 32px; letter-spacing: .14em; text-transform: uppercase; color: #c9d2ff; margin-top: 8px; }

/* Caption backdrop */
#cap-shade { position: absolute; left: 0; right: 0; bottom: 0; height: 820px; }
#cap-shade-in { position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 38%, rgba(0,0,0,.82) 70%, rgba(0,0,0,.9) 100%); }

/* Captions */
.cap { position: absolute; left: 60px; right: 60px; top: 1290px; height: 320px; display: flex; align-items: center; justify-content: center; }
.cap-inner { display: block; max-width: 960px; text-align: center; font-weight: 900; font-size: 84px; line-height: 1.12;
  text-transform: uppercase; color: #fff; -webkit-text-stroke: 14px #000; paint-order: stroke fill;
  text-shadow: 0 8px 26px rgba(0,0,0,.6); }
.cap-inner .hl { color: var(--orange); }
"""


def caption_html(i, c):
    s, e, text, hl = c
    words = text.split(" ")
    spans = " ".join(f'<span class="hl">{esc(w)}</span>' if k in hl else esc(w) for k, w in enumerate(words))
    return (f'      <div id="cap-{i}" class="clip cap" data-start="{s}" data-duration="{round(e - s, 2)}" '
            f'data-track-index="3"><span class="cap-inner" id="cap-{i}-in">{spans}</span></div>')


def broll_html(bid, s, e):
    return (f'      <section id="{bid}" class="clip broll" data-start="{s}" data-duration="{round(e - s, 2)}" '
            f'data-track-index="1">{BROLL_HTML[bid]}\n      </section>')


def overlay_html(oid, s, e):
    return (f'      <div id="{oid}" class="clip ovl" data-start="{s}" data-duration="{round(e - s, 2)}" '
            f'data-track-index="4">{OVERLAY_HTML[oid]}</div>')


JS = """
const tl = gsap.timeline({ paused: true });
const BROLL = __BROLL__;
const CAPS = __CAPS__;
const PUNCHES = __PUNCHES__;

// A-roll punch-ins (hard cut in, hard cut out)
PUNCHES.forEach(([s, e, k]) => { tl.set("#aroll-zoom", { scale: k }, s); tl.set("#aroll-zoom", { scale: 1 }, e); });

// Caption backdrop + caption pops
tl.fromTo("#cap-shade-in", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0);
CAPS.forEach(([s], i) => {
  tl.fromTo(`#cap-${i}-in`, { scale: 0.82, y: 24, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.18, ease: "back.out(2.2)" }, s);
});

// Cutaway in/out on each stage
BROLL.forEach(([id, s, e]) => {
  const st = `#${id} .stage`;
  tl.fromTo(st, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.22, ease: "power2.out" }, s);
  if (e < __DUR__) tl.to(st, { opacity: 0, duration: 0.18, ease: "power1.in" }, e - 0.18);
});

// b-stat: 0 -> 95%, falling line
const st = { v: 0 };
const stEl = document.getElementById("st-val");
tl.to(st, { v: 95, duration: 0.8, ease: "power2.out", onUpdate: () => { stEl.textContent = Math.round(st.v); } }, 0.65);
tl.fromTo("#st-k", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 1.5);
tl.fromTo("#st-line", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power1.inOut" }, 1.7);

// b-without: one X per spoken item
[["#w-1", 3.7], ["#w-2", 4.45], ["#w-3", 5.5]].forEach(([sel, t]) =>
  tl.fromTo(sel, { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, t));

// o-title: book title card above his head while he names it
tl.fromTo("#ot-card", { y: -40, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }, 7.95);
tl.to("#ot-card", { opacity: 0, y: -30, duration: 0.2, ease: "power1.in" }, 9.8);

// o-lang: Hindi + English chips
tl.fromTo("#ol-hi", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 11.2);
tl.fromTo("#ol-amp", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, 11.45);
tl.fromTo("#ol-en", { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 11.6);
tl.fromTo("#ol-hi", { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, 12.2);
tl.fromTo(["#ol-amp", "#ol-en"], { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, 12.2);

// b-free ticket
tl.fromTo("#ticket", { y: 220, rotation: -8, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.55, ease: "back.out(1.6)" }, 13.5);
tl.fromTo("#ticket-shine", { x: -260 }, { x: 1100, duration: 0.9, ease: "power2.inOut" }, 14.3);

// b-chart: candles, then each marker on its word
tl.fromTo("#b-chart .cdl", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.035, ease: "power2.out" }, 18.5);
tl.fromTo("#c-pick", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 18.6);
[["#mk-buy", 19.55], ["#mk-sell", 20.2], ["#mk-exit", 20.85], ["#lv-stop", 21.5]].forEach(([sel, t]) =>
  tl.fromTo(sel, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, t));

// b-topdown: market -> sector -> stock
tl.fromTo("#td-1", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 24.5);
tl.fromTo("#td-2", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 25.6);
tl.fromTo("#td-3", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 25.95);

// b-hours
tl.fromTo("#clk", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" }, 26.6);
tl.fromTo("#clk-hand", { rotation: 0 }, { rotation: 540, duration: 3.0, ease: "power1.inOut" }, 26.65);
tl.fromTo("#hr-free", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 27.65);
tl.fromTo("#hr-int", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 28.2);

// b-cta: cursor clicks Book your seat
tl.fromTo("#cta-k", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 30.7);
tl.fromTo("#cta-btn", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, 30.8);
tl.fromTo("#cta-sub", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 31.1);
tl.fromTo("#cta-cursor", { x: 240, y: 360, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.6, ease: "power2.inOut" }, 31.0);
tl.to("#cta-btn", { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, 31.65);
tl.fromTo("#cta-ripple", { scale: 0, opacity: 0.8 }, { scale: 14, opacity: 0, duration: 0.7, ease: "power2.out" }, 31.7);

window.__timelines["main"] = tl;
"""


def build():
    music_auto = {"version": 1, "lanes": [{"target": "volume", "points": [
        {"t": 0, "v": 0}, {"t": 1.0, "v": MUSIC}, {"t": DUR - 2.5, "v": MUSIC}, {"t": DUR, "v": 0}]}]}
    js = (JS.replace("__BROLL__", json.dumps(BROLL)).replace("__CAPS__", json.dumps([c[:2] for c in CAPTIONS]))
          .replace("__PUNCHES__", json.dumps(PUNCHES)).replace("__DUR__", str(DUR)))
    body = "\n".join([
        '      <div id="aroll-zoom">',
        f'        <video id="aroll" class="clip" src="assets/cashtag.mp4" playsinline data-has-audio="true" data-start="0" '
        f'data-duration="{DUR}" data-track-index="0" data-volume="1"></video>',
        '      </div>',
        *[overlay_html(*o) for o in OVERLAYS],
        *[broll_html(*b) for b in BROLL],
        f'      <div id="cap-shade" class="clip" data-start="0" data-duration="{DUR}" data-track-index="2"><div id="cap-shade-in"></div></div>',
        *[caption_html(i, c) for i, c in enumerate(CAPTIONS)],
        f'      <audio id="music" src="assets/audio/music-bed.m4a" data-start="0" data-duration="{DUR}" data-track-index="5" '
        f"data-volume=\"{MUSIC}\" data-automation='{json.dumps(music_auto)}'></audio>",
    ])
    out = f"""<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Cashtag VBM ad 2 (edit)</title>
    <script src="assets/vendor/gsap.min.js"></script>
    <style>{CSS}    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
{body}
    </div>
    <script>{js}    </script>
  </body>
</html>
"""
    pathlib.Path(__file__).with_name("index.html").write_text(out, encoding="utf-8")


if __name__ == "__main__":
    build()
