#!/usr/bin/env python3
"""Generate index.html for "ABCT with AI — new ad 2": A-roll + English captions + B-roll cutaways + music.

Edit CAPTIONS / BROLL / PUNCHES below and re-run `python3 build.py`.
Captions are an English translation of the Hinglish voiceover (Whisper large-v3 translate
pass + Parakeet word onsets for timing, hand-corrected).
"""
import html, json, pathlib

DUR = 37.3
MUSIC = 0.08  # bed level; the automation lane is absolute, so it carries this value too
LOGO = "assets/brand/abct-ai-logo-light.png"

# (start, end, text, indices of highlighted words)
CAPTIONS = [
    (0.20, 1.40, "In 1996,", [1]),
    (1.40, 2.50, "I joined the market,", [3]),
    (2.50, 3.20, "30 years ago.", [0, 1]),
    (3.20, 4.70, "For the last 19 years,", [3, 4]),
    (4.70, 5.80, "I've taught just one strategy:", [3, 4]),
    (5.80, 6.40, "GFS.", [0]),
    (6.40, 7.90, "Until now, it was paid.", [4]),
    (7.90, 8.85, "Now I've recorded", [2]),
    (8.85, 10.06, "a free video for you.", [1, 2]),
    (10.06, 10.95, "Watch it right away:", [3]),
    (10.95, 12.30, "click the link and check it out.", [2]),
    (12.30, 14.20, "In this video, you'll learn", [4]),
    (14.20, 15.50, "how to select a stock,", [3, 4]),
    (15.50, 16.60, "where to enter, where to exit,", [2, 5]),
    (16.60, 18.40, "where to place your stop loss", [4, 5]),
    (18.40, 19.40, "(that's risk management)", [1, 2]),
    (19.40, 21.20, "and how to control your mind.", [3, 5]),
    (21.20, 22.60, "In one hour, you may not become", [1, 2]),
    (22.60, 24.50, "an expert or a systematic trader,", [1, 4]),
    (24.50, 26.10, "but you'll understand how trading works", [5]),
    (26.10, 27.95, "and what systematic trading is.", [2, 3]),
    (27.95, 29.10, "After that, if you want,", []),
    (29.10, 30.20, "you can join the 4-day", [4]),
    # 30.20-31.90: "ABCT with AI" is spoken; the logo cutaway carries it
    (31.90, 33.18, "All the details are inside.", [3]),
    (33.18, 34.20, "So join the free", [3]),
    (34.20, 34.85, "1-hour masterclass", [0, 1]),
    (34.85, 35.40, "right now", [0, 1]),
    (35.40, 36.30, "and get my GFS strategy", [3]),
    (36.30, DUR, "for FREE!", [1]),
]

# B-roll cutaways: (id, start, end). Bodies are defined in BROLL_HTML.
BROLL = [
    ("b-years", 1.40, 3.20),
    ("b-gfs", 3.20, 6.40),
    ("b-free", 6.40, 10.06),
    ("b-watch", 10.95, 12.30),
    ("b-chart", 14.20, 19.40),
    ("b-hour", 24.50, 27.95),
    ("b-abct", 30.20, 31.90),
    ("b-cta", 33.18, DUR),
]

# Punch-in zooms on the A-roll between cutaways: (start, end, scale)
PUNCHES = [(12.30, 14.20, 1.18), (19.40, 22.60, 1.14), (27.95, 30.20, 1.18), (31.90, 33.18, 1.22)]


def esc(s):
    return html.escape(s, quote=True)


def candles():
    # deterministic uptrend candles for the chart cutaway (x, open, close, high, low in SVG units)
    closes = [500, 470, 486, 440, 404, 420, 372, 330, 352, 300, 262, 280, 222, 196]
    out, prev = [], 530
    for i, c in enumerate(closes):
        o = prev
        x = 40 + i * 52
        hi, lo = min(o, c) - 18 - (i * 7) % 16, max(o, c) + 16 + (i * 5) % 14
        up = c < o
        col = "#19b37a" if up else "#e2554f"
        top, h = min(o, c), max(4, abs(o - c))
        out.append(
            f'<g class="cdl"><line x1="{x + 17}" x2="{x + 17}" y1="{hi}" y2="{lo}" stroke="{col}" stroke-width="4"/>'
            f'<rect x="{x}" y="{top}" width="34" height="{h}" rx="4" fill="{col}"/></g>'
        )
        prev = c
    return "".join(out)


BROLL_HTML = {
    "b-years": """
      <div class="stage">
        <div class="kicker">In the market since</div>
        <div class="year" id="yr">1996</div>
        <div class="pill gold" id="yr-pill">30 years of trading</div>
      </div>""",
    "b-gfs": """
      <div class="stage">
        <div class="big19" id="g19">19 <small>years</small></div>
        <div class="kicker" id="g-one">Teaching just one strategy</div>
        <div class="gfs" id="g-badge">GFS</div>
      </div>""",
    "b-free": """
      <div class="stage">
        <div class="vcard" id="vcard">
          <div class="v-thumb"><div class="v-play"></div><span class="v-tag">GFS Strategy</span></div>
          <div class="v-meta"><b>Full strategy video</b><small>Recorded by me, for you</small></div>
          <div class="v-paid" id="v-paid">PAID</div>
          <div class="v-free" id="v-free">FREE</div>
        </div>
      </div>""",
    "b-watch": """
      <div class="stage">
        <div class="btn" id="w-btn">Watch now<div class="ripple" id="w-ripple"></div></div>
        <div class="kicker under">Click the link</div>
        <svg class="cursor" id="w-cursor" viewBox="0 0 24 24" width="96" height="96"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b1020" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>""",
    "b-chart": f"""
      <div class="stage">
        <div class="kicker" id="c-k">Inside the video</div>
        <div class="chartbox">
          <svg class="cs" viewBox="0 0 900 620" width="900" height="620">
            {candles()}
            <g class="lvl" id="lv-entry"><line x1="0" x2="900" y1="420" y2="420" stroke="#39d5ff" stroke-width="5" stroke-dasharray="18 12"/><rect x="664" y="386" width="236" height="68" rx="14" fill="#39d5ff"/><text x="782" y="432" text-anchor="middle">ENTRY</text></g>
            <g class="lvl" id="lv-exit"><line x1="0" x2="900" y1="130" y2="130" stroke="#19b37a" stroke-width="5" stroke-dasharray="18 12"/><rect x="664" y="96" width="236" height="68" rx="14" fill="#19b37a"/><text x="782" y="142" text-anchor="middle">EXIT</text></g>
            <g class="lvl" id="lv-stop"><line x1="0" x2="900" y1="560" y2="560" stroke="#e2554f" stroke-width="5" stroke-dasharray="18 12"/><rect x="604" y="526" width="296" height="68" rx="14" fill="#e2554f"/><text x="752" y="572" text-anchor="middle">STOP LOSS</text></g>
          </svg>
          <div class="pill" id="c-pick"><span class="tickmini">&#10003;</span>Stock selection</div>
        </div>
        <div class="pill gold" id="c-risk">Risk management</div>
      </div>""",
    "b-hour": """
      <div class="stage">
        <div class="clock" id="clk"><div class="hand" id="clk-hand"></div><b>1</b><small>hour</small></div>
        <div class="list">
          <div class="item" id="h-1"><span class="tick">&#10003;</span><div><b>How trading works</b></div></div>
          <div class="item" id="h-2"><span class="tick">&#10003;</span><div><b>What systematic trading is</b></div></div>
        </div>
      </div>""",
    "b-abct": f"""
      <div class="stage">
        <div class="pill gold" id="a-days">4-day program</div>
        <img class="logo-big" id="a-logo" src="{LOGO}" alt="Anybody Can Trade with AI" />
      </div>""",
    "b-cta": """
      <div class="stage">
        <div class="kicker" id="cta-k">Free 1-hour masterclass</div>
        <div class="cta-big" id="cta-big">Get my <em>GFS</em> strategy <span>free</span></div>
        <div class="btn" id="cta-btn">Join now<div class="ripple" id="cta-ripple"></div></div>
        <svg class="cursor" id="cta-cursor" viewBox="0 0 24 24" width="96" height="96"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b1020" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>""",
}

CSS = """
@font-face { font-family: "Montserrat"; font-weight: 900; src: url(assets/fonts/montserrat-latin-900-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 900; src: url(assets/fonts/montserrat-latin-ext-900-normal.woff2) format("woff2"); unicode-range: U+0100-02AF, U+20A0-20CF; }
@font-face { font-family: "Montserrat"; font-weight: 800; src: url(assets/fonts/montserrat-latin-800-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 600; src: url(assets/fonts/montserrat-latin-600-normal.woff2) format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b1020; }
:root { --navy: #0b1020; --ink: #f5f7ff; --gold: #ffc83d; --cyan: #39d5ff; --green: #19b37a; --red: #e2554f; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Montserrat", sans-serif; color: var(--ink); }
#aroll-zoom { position: absolute; inset: 0; transform-origin: 50% 16%; }
#aroll { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* B-roll cutaways */
.broll { position: absolute; inset: 0; overflow: hidden; }
.broll .stage { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 160px 80px 760px; gap: 44px;
  background: radial-gradient(120% 70% at 50% 30%, #1b2550 0%, #0b1020 62%), #0b1020; }
.broll .stage::before { content: ""; position: absolute; inset: 0; opacity: .18;
  background-image: linear-gradient(#3a4a8a 1px, transparent 1px), linear-gradient(90deg, #3a4a8a 1px, transparent 1px);
  background-size: 90px 90px; }
.kicker { position: relative; font-weight: 800; font-size: 44px; letter-spacing: .14em; text-transform: uppercase; color: var(--cyan); }
.kicker.under { color: #c9d2ff; font-size: 38px; }
.pill { position: relative; display: flex; align-items: center; gap: 20px; padding: 26px 48px; border-radius: 999px; font-weight: 900;
  font-size: 54px; text-transform: uppercase; background: rgba(255,255,255,.08); border: 3px solid rgba(255,255,255,.22); }
.pill.gold { border-color: var(--gold); color: var(--gold); }

.year { position: relative; font-weight: 900; font-size: 300px; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }

.big19 { position: relative; font-weight: 900; font-size: 280px; line-height: .9; color: var(--gold); }
.big19 small { font-size: 90px; color: var(--ink); text-transform: uppercase; }
.gfs { position: relative; padding: 30px 90px; border-radius: 34px; font-weight: 900; font-size: 170px; line-height: 1; color: #0b1020;
  background: linear-gradient(135deg, #ffe08a, var(--gold)); box-shadow: 0 30px 90px rgba(255,200,61,.4); }

.vcard { position: relative; width: 860px; border-radius: 36px; overflow: hidden; background: #f5f7ff; color: #121838;
  box-shadow: 0 40px 120px rgba(0,0,0,.55); }
.v-thumb { position: relative; height: 420px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1b2550, #0b1020); }
.v-play { width: 0; height: 0; border-top: 70px solid transparent; border-bottom: 70px solid transparent; border-left: 120px solid #fff; margin-left: 30px; }
.v-tag { position: absolute; left: 30px; top: 30px; padding: 12px 26px; border-radius: 14px; background: var(--gold); font-weight: 900; font-size: 34px; text-transform: uppercase; }
.v-meta { padding: 34px 40px 40px; }
.v-meta b { display: block; font-weight: 900; font-size: 52px; }
.v-meta small { display: block; font-weight: 600; font-size: 34px; color: #4a5385; margin-top: 8px; }
.v-paid, .v-free { position: absolute; right: 34px; bottom: 44px; padding: 14px 34px; border-radius: 16px; font-weight: 900; font-size: 54px; }
.v-paid { color: #8a90b0; border: 4px solid #b8c0e6; text-decoration: line-through; text-decoration-thickness: 6px; }
.v-free { color: #fff; background: var(--green); transform-origin: 50% 50%; }

.chartbox { position: relative; width: 900px; height: 620px; border-radius: 30px; background: rgba(255,255,255,.05); border: 3px solid rgba(255,255,255,.15); }
.cs { position: absolute; inset: 0; }
.cs text { font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 36px; fill: #0b1020; }
#c-pick { position: absolute; left: 30px; top: 30px; font-size: 38px; padding: 16px 30px; background: rgba(11,16,32,.85); }
.tickmini { display: inline-flex; width: 52px; height: 52px; border-radius: 50%; align-items: center; justify-content: center; background: var(--gold); color: #121838; font-size: 32px; }

.clock { position: relative; width: 340px; height: 340px; border-radius: 50%; border: 14px solid var(--gold); display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(255,255,255,.05); }
.clock b { font-weight: 900; font-size: 170px; line-height: .9; }
.clock small { font-weight: 800; font-size: 50px; text-transform: uppercase; color: #c9d2ff; }
.hand { position: absolute; left: 50%; top: 22px; width: 10px; height: 136px; margin-left: -5px; border-radius: 6px; background: var(--cyan); transform-origin: 50% 100%; }
.list { position: relative; display: flex; flex-direction: column; gap: 30px; width: 900px; }
.item { display: flex; align-items: center; gap: 34px; padding: 30px 40px; border-radius: 32px; background: rgba(255,255,255,.08); border: 3px solid rgba(255,255,255,.2); }
.item b { display: block; font-weight: 900; font-size: 46px; white-space: nowrap; }
.tick { flex: none; width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--gold); color: #121838; font-size: 52px; font-weight: 900; }

.logo-big { position: relative; display: block; width: 900px; filter: drop-shadow(0 0 50px rgba(57,213,255,.45)); }

.cta-big { position: relative; max-width: 900px; text-align: center; font-weight: 900; font-size: 104px; line-height: 1.05; text-transform: uppercase; }
.cta-big em { font-style: normal; color: var(--gold); }
.cta-big span { color: var(--green); }
.btn { position: relative; overflow: hidden; padding: 48px 100px; border-radius: 999px; background: var(--gold); color: #121838;
  font-weight: 900; font-size: 78px; text-transform: uppercase; box-shadow: 0 30px 90px rgba(255,200,61,.4); }
.ripple { position: absolute; left: 70%; top: 60%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,.7); }
.cursor { position: absolute; left: 720px; }
#w-cursor { top: 640px; }
#cta-cursor { top: 940px; }

/* Caption backdrop */
#cap-shade { position: absolute; left: 0; right: 0; bottom: 0; height: 820px; }
#cap-shade-in { position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 38%, rgba(0,0,0,.82) 70%, rgba(0,0,0,.9) 100%); }

/* Captions */
.cap { position: absolute; left: 60px; right: 60px; top: 1290px; height: 320px; display: flex; align-items: center; justify-content: center; }
.cap-inner { display: block; max-width: 960px; text-align: center; font-weight: 900; font-size: 84px; line-height: 1.12;
  text-transform: uppercase; color: #fff; -webkit-text-stroke: 14px #000; paint-order: stroke fill;
  text-shadow: 0 8px 26px rgba(0,0,0,.6); }
.cap-inner .hl { color: var(--gold); }
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

// b-years: 1996 counts up to 2026
const yr = { v: 1996 };
const yrEl = document.getElementById("yr");
tl.to(yr, { v: 2026, duration: 1.1, ease: "power2.inOut", onUpdate: () => { yrEl.textContent = Math.round(yr.v); } }, 1.55);
tl.fromTo("#yr-pill", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 2.5);

// b-gfs
tl.fromTo("#g19", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)" }, 3.3);
tl.fromTo("#g-one", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 4.7);
tl.fromTo("#g-badge", { scale: 2.2, rotation: -10, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.35, ease: "power4.out" }, 5.8);

// b-free: PAID, then the FREE stamp lands on "free"
tl.fromTo("#vcard", { y: 160, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 6.45);
tl.fromTo("#v-free", { scale: 3, rotation: -14, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.3, ease: "power4.out" }, 8.9);
tl.to("#v-paid", { opacity: 0, duration: 0.15 }, 8.9);

// b-watch: cursor clicks Watch now
tl.fromTo("#w-btn", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 11.0);
tl.fromTo("#w-cursor", { x: 220, y: 380, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power2.inOut" }, 11.1);
tl.to("#w-btn", { scale: 0.94, duration: 0.07, yoyo: true, repeat: 1 }, 11.65);
tl.fromTo("#w-ripple", { scale: 0, opacity: 0.8 }, { scale: 14, opacity: 0, duration: 0.5, ease: "power2.out" }, 11.7);

// b-chart: candles draw in, then each level lands on its word
tl.fromTo("#b-chart .cdl", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }, 14.3);
tl.fromTo("#c-pick", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 14.55);
[["#lv-entry", 15.5], ["#lv-exit", 16.15], ["#lv-stop", 16.65]].forEach(([sel, t]) =>
  tl.fromTo(sel, { opacity: 0, x: -120 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, t));
tl.fromTo("#c-risk", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, 18.7);

// b-hour
tl.fromTo("#clk", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" }, 24.55);
tl.fromTo("#clk-hand", { rotation: 0 }, { rotation: 360, duration: 3.3, ease: "none" }, 24.6);
tl.fromTo("#h-1", { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 25.0);
tl.fromTo("#h-2", { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 26.3);

// b-abct: logo carries the spoken name
tl.fromTo("#a-logo", { scale: 0.6, rotation: -6, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }, 30.22);
tl.fromTo("#a-days", { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 30.4);

// b-cta
tl.fromTo("#cta-k", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 33.25);
tl.fromTo("#cta-big", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, 33.4);
tl.fromTo("#cta-btn", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, 34.85);
tl.fromTo("#cta-cursor", { x: 240, y: 360, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.6, ease: "power2.inOut" }, 35.1);
tl.to("#cta-btn", { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, 35.75);
tl.fromTo("#cta-ripple", { scale: 0, opacity: 0.8 }, { scale: 14, opacity: 0, duration: 0.7, ease: "power2.out" }, 35.8);
tl.to("#cta-btn", { scale: 1.05, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 36.4);

window.__timelines["main"] = tl;
"""


def build():
    music_auto = {"version": 1, "lanes": [{"target": "volume", "points": [
        {"t": 0, "v": 0}, {"t": 1.0, "v": MUSIC}, {"t": DUR - 2.5, "v": MUSIC}, {"t": DUR, "v": 0}]}]}
    js = (JS.replace("__BROLL__", json.dumps(BROLL)).replace("__CAPS__", json.dumps([c[:2] for c in CAPTIONS]))
          .replace("__PUNCHES__", json.dumps(PUNCHES)).replace("__DUR__", str(DUR)))
    body = "\n".join([
        '      <div id="aroll-zoom">',
        f'        <video id="aroll" class="clip" src="assets/ad2.mp4" playsinline data-has-audio="true" data-start="0" '
        f'data-duration="{DUR}" data-track-index="0" data-volume="1"></video>',
        '      </div>',
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
    <title>ABCT with AI — new ad 2 (edit)</title>
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
