#!/usr/bin/env python3
"""Generate index.html for the Ad 4 edit: A-roll + English captions + B-roll cutaways + music.

Edit CAPTIONS / BROLL / PUNCHES below and re-run `python3 build.py`.
Captions are an English translation of the Hinglish voiceover (Whisper large-v3 translate
pass + Parakeet word onsets for timing, hand-corrected).
"""
import html, json, pathlib

DUR = 44.5
MUSIC = 0.08  # bed level; the automation lane is absolute, so it carries this value too

# (start, end, text, indices of highlighted words)
CAPTIONS = [
    (0.20, 1.30, "Anybody Can Trade", [2]),
    (1.30, 3.36, "Have you attended it before?", [2]),
    (3.36, 4.60, "3 years ago, 2 years ago,", []),
    (4.60, 5.65, "or 6 months ago?", [1, 2]),
    (5.65, 8.20, "I have a special invitation", [3, 4]),
    (8.20, 9.80, "because we're bringing ABCT back", [3]),
    (9.80, 11.50, "in a whole new way.", [2, 3]),
    (11.50, 13.10, "This time, it's", [1]),
    (13.10, 14.40, "ABCT with AI.", [0, 2]),
    (14.40, 16.30, "In the age of AI,", [4]),
    (16.30, 17.80, "ABCT's mindset & strategies", [1, 3]),
    (17.80, 19.66, "how to use them, which prompts to use", [5]),
    (19.66, 21.30, "and how to make trading", [4]),
    (21.30, 22.40, "even simpler.", [1]),
    (22.40, 23.90, "As an ABCT alumni,", [2, 3]),
    (23.90, 25.40, "I'm inviting you", [1]),
    (25.40, 26.60, "to join ABCT again", [1, 2]),
    (26.60, 28.40, "on 4th, 5th & 6th September.", [1, 2, 4, 5]),
    (28.40, 31.10, "Plus an AI Implementation Day", [2, 3, 4]),
    (31.10, 32.10, "plus a 3-day", [2]),
    (32.10, 33.92, "Happiness Course!", [0, 1]),
    (33.92, 35.40, "And all of this", []),
    (35.40, 37.06, "for just ₹999!", [2]),
    (37.06, 38.60, "Because you're an alumni,", [3]),
    (38.60, 40.20, "you've done ABCT once.", [2]),
    (40.20, 41.60, "This time, do it with AI.", [5]),
    (41.60, 42.50, "So click the link", [3]),
    (42.50, 43.35, "and book your seat", [1, 3]),
    (43.35, DUR, "for ABCT with AI.", [1, 3]),
]

# B-roll cutaways: (id, start, end). Bodies are defined in BROLL_HTML.
BROLL = [
    ("b-rewind", 3.36, 5.65),
    ("b-invite", 5.65, 8.20),
    ("b-ai", 13.10, 16.30),
    ("b-prompt", 17.80, 21.30),
    ("b-dates", 26.60, 28.40),
    ("b-offer", 28.40, 33.00),
    ("b-price", 35.40, 37.06),
    ("b-cta", 41.60, DUR),
]

# Punch-in zooms on the A-roll between cutaways: (start, end, scale)
PUNCHES = [(8.20, 11.50, 1.12), (22.40, 26.60, 1.10), (37.06, 41.60, 1.12)]

PROMPT = "Build me a simple trading plan using ABCT strategies"


def esc(s):
    return html.escape(s, quote=True)


def chars(text, cls):
    # one inline-block per word (so lines wrap normally), one span per character inside it
    return " ".join(
        '<span class="pw">' + "".join(f'<span class="{cls}">{esc(c)}</span>' for c in w) + "</span>"
        for w in text.split(" ")
    )


BROLL_HTML = {
    "b-rewind": """
      <div class="stage">
        <div class="kicker">Remember this?</div>
        <div class="rail">
          <div class="chip" id="rw-1"><span class="dot"></span>3 years ago</div>
          <div class="chip" id="rw-2"><span class="dot"></span>2 years ago</div>
          <div class="chip gold" id="rw-3"><span class="dot"></span>6 months ago</div>
        </div>
      </div>""",
    "b-invite": """
      <div class="stage">
        <div class="ticket" id="ticket">
          <div class="t-label">Special Invitation</div>
          <div class="t-title">ABCT</div>
          <div class="t-sub">Alumni Edition</div>
          <div class="t-tear"></div>
          <div class="t-foot">Admit one &middot; Anybody Can Trade</div>
          <div class="shine" id="ticket-shine" data-layout-allow-overflow></div>
        </div>
      </div>""",
    "b-ai": """
      <div class="stage">
        <div class="orbit o1" id="orb-1"></div>
        <div class="orbit o2" id="orb-2"></div>
        <div class="lockup">
          <span class="l-abct" id="lk-abct">ABCT</span>
          <span class="l-x" id="lk-x">&times;</span>
          <span class="l-ai" id="lk-ai">AI</span>
        </div>
        <div class="kicker under" id="lk-sub">Trading in the age of AI</div>
      </div>""",
    "b-prompt": f"""
      <div class="stage">
        <div class="window" id="pw">
          <div class="w-bar"><i></i><i></i><i></i><span>AI Assistant</span></div>
          <div class="w-body">
            <div class="bubble you"><b>You</b><p id="prompt-text">{chars(PROMPT, "pc")}</p></div>
            <div class="bubble ai" id="ai-bubble"><b>AI</b>
              <div class="chart">{"".join(f'<div class="bar {"dn" if i in (2, 5) else "up"}" style="height:{h}%"></div>' for i, h in enumerate([34, 46, 40, 58, 70, 62, 82, 94]))}</div>
            </div>
          </div>
        </div>
      </div>""",
    "b-dates": """
      <div class="stage">
        <div class="kicker">Join us again</div>
        <div class="month">September</div>
        <div class="days">
          <div class="day" id="d4">4</div><div class="day" id="d5">5</div><div class="day" id="d6">6</div>
        </div>
      </div>""",
    "b-offer": """
      <div class="stage">
        <div class="kicker">What you get</div>
        <div class="list">
          <div class="item" id="of-1"><span class="tick">&#10003;</span><div><b>ABCT with AI</b><small>4 &middot; 5 &middot; 6 September</small></div></div>
          <div class="item" id="of-2"><span class="tick">&#10003;</span><div><b>AI Implementation Day</b><small>Put it into practice</small></div></div>
          <div class="item" id="of-3"><span class="tick">&#10003;</span><div><b>3-Day Happiness Course</b><small>Included</small></div></div>
        </div>
      </div>""",
    "b-price": """
      <div class="stage">
        <div class="kicker">All of this for just</div>
        <div class="price" id="price">&#8377;999</div>
      </div>""",
    "b-cta": """
      <div class="stage">
        <div class="cta-title" id="cta-title">ABCT <em>with AI</em></div>
        <div class="btn" id="cta-btn">Book your seat<div class="ripple" id="cta-ripple"></div></div>
        <div class="kicker under" id="cta-sub">Click the link below</div>
        <svg class="cursor" id="cta-cursor" viewBox="0 0 24 24" width="96" height="96"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b1020" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>""",
}

CSS = """
@font-face { font-family: "Montserrat"; font-weight: 900; src: url(assets/fonts/montserrat-latin-900-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 900; src: url(assets/fonts/montserrat-latin-ext-900-normal.woff2) format("woff2"); unicode-range: U+0100-02AF, U+20A0-20CF; }
@font-face { font-family: "Montserrat"; font-weight: 800; src: url(assets/fonts/montserrat-latin-800-normal.woff2) format("woff2"); }
@font-face { font-family: "Montserrat"; font-weight: 800; src: url(assets/fonts/montserrat-latin-ext-800-normal.woff2) format("woff2"); unicode-range: U+0100-02AF, U+20A0-20CF; }
@font-face { font-family: "Montserrat"; font-weight: 600; src: url(assets/fonts/montserrat-latin-600-normal.woff2) format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b1020; }
:root { --navy: #0b1020; --ink: #f5f7ff; --gold: #ffc83d; --cyan: #39d5ff; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Montserrat", sans-serif; color: var(--ink); }
#aroll-zoom { position: absolute; inset: 0; transform-origin: 50% 30%; }
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

.rail { position: relative; display: flex; flex-direction: column; gap: 34px; width: 760px; }
.chip { display: flex; align-items: center; gap: 28px; padding: 30px 44px; border-radius: 999px; font-weight: 900; font-size: 64px;
  text-transform: uppercase; background: rgba(255,255,255,.08); border: 3px solid rgba(255,255,255,.22); }
.chip .dot { width: 30px; height: 30px; border-radius: 50%; background: var(--cyan); flex: none; }
.chip.gold { border-color: var(--gold); color: var(--gold); }
.chip.gold .dot { background: var(--gold); }

.ticket { position: relative; width: 820px; padding: 64px 60px 50px; border-radius: 40px; overflow: hidden; text-align: center;
  background: linear-gradient(150deg, #20295a, #121838); border: 5px solid var(--gold); box-shadow: 0 40px 120px rgba(0,0,0,.55); }
.t-label { font-weight: 800; font-size: 40px; letter-spacing: .2em; text-transform: uppercase; color: var(--gold); }
.t-title { font-weight: 900; font-size: 210px; line-height: 1; margin-top: 18px; }
.t-sub { font-weight: 800; font-size: 50px; text-transform: uppercase; letter-spacing: .08em; color: #c9d2ff; }
.t-tear { margin: 44px -60px 30px; border-top: 5px dashed rgba(255,200,61,.6); }
.t-foot { font-weight: 600; font-size: 34px; color: #c9d2ff; }
.shine { position: absolute; top: -20%; bottom: -20%; left: 0; width: 180px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); transform: skewX(-20deg); }

.orbit { position: absolute; left: 50%; top: 36%; border-radius: 50%; border: 3px solid rgba(57,213,255,.35); }
.o1 { width: 900px; height: 900px; margin: -450px 0 0 -450px; border-style: dashed; }
.o2 { width: 640px; height: 640px; margin: -320px 0 0 -320px; border-color: rgba(255,200,61,.35); }
.lockup { position: relative; display: flex; align-items: baseline; gap: 26px; font-weight: 900; font-size: 190px; line-height: 1; }
.l-abct, .l-x, .l-ai { display: inline-block; }
.l-x { color: var(--gold); font-size: 140px; }
.l-ai { color: var(--cyan); text-shadow: 0 0 60px rgba(57,213,255,.8); }

.window { position: relative; width: 900px; border-radius: 34px; overflow: hidden; background: #f5f7ff; color: #121838; box-shadow: 0 40px 120px rgba(0,0,0,.55); }
.w-bar { display: flex; align-items: center; gap: 14px; padding: 24px 32px; background: #e2e7fb; font-weight: 800; font-size: 30px; }
.w-bar i { width: 20px; height: 20px; border-radius: 50%; background: #b8c0e6; }
.w-bar span { margin-left: 14px; }
.w-body { display: flex; flex-direction: column; gap: 30px; padding: 40px 36px 44px; }
.bubble { border-radius: 26px; padding: 26px 30px; font-size: 42px; line-height: 1.3; }
.bubble b { display: block; font-size: 26px; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 10px; }
.bubble.you { background: #121838; color: #f5f7ff; align-self: flex-end; width: 92%; font-weight: 800; }
.bubble.you b { color: var(--gold); }
.bubble.ai { background: #e2e7fb; width: 92%; }
.bubble.ai b { color: #1a7fa0; }
.pw { display: inline-block; }
.pc { display: inline; }
.chart { display: flex; align-items: flex-end; gap: 18px; height: 230px; padding-top: 10px; }
.bar { flex: 1; border-radius: 10px; transform-origin: 50% 100%; }
.bar.up { background: #19b37a; }
.bar.dn { background: #e2554f; }

.month { position: relative; font-weight: 900; font-size: 120px; text-transform: uppercase; color: var(--gold); }
.days { position: relative; display: flex; gap: 40px; }
.day { width: 240px; height: 260px; border-radius: 36px; display: flex; align-items: center; justify-content: center; font-weight: 900;
  font-size: 170px; background: #f5f7ff; color: #121838; box-shadow: 0 30px 80px rgba(0,0,0,.5); border-top: 40px solid var(--gold); }

.list { position: relative; display: flex; flex-direction: column; gap: 34px; width: 900px; }
.item { display: flex; align-items: center; gap: 34px; padding: 34px 40px; border-radius: 32px; background: rgba(255,255,255,.08);
  border: 3px solid rgba(255,255,255,.2); }
.item b { display: block; font-weight: 900; font-size: 52px; }
.item small { display: block; font-weight: 600; font-size: 32px; color: #c9d2ff; margin-top: 6px; }
.tick { flex: none; width: 92px; height: 92px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--gold); color: #121838; font-size: 54px; font-weight: 900; }

.price { position: relative; font-weight: 900; font-size: 330px; line-height: 1; color: var(--gold); text-shadow: 0 20px 80px rgba(255,200,61,.45); }

.cta-title { position: relative; white-space: nowrap; font-weight: 900; font-size: 112px; line-height: 1; }
.cta-title em { font-style: normal; color: var(--cyan); }
.btn { position: relative; overflow: hidden; padding: 48px 90px; border-radius: 999px; background: var(--gold); color: #121838;
  font-weight: 900; font-size: 74px; text-transform: uppercase; box-shadow: 0 30px 90px rgba(255,200,61,.4); }
.ripple { position: absolute; left: 70%; top: 60%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,.7); }
.cursor { position: absolute; left: 800px; top: 690px; }

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

// Captions pop
CAPS.forEach(([s], i) => {
  tl.fromTo(`#cap-${i}-in`, { scale: 0.82, y: 24, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.18, ease: "back.out(2.2)" }, s);
});

// Cutaway in/out on each stage
BROLL.forEach(([id, s, e]) => {
  const st = `#${id} .stage`;
  tl.fromTo(st, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.22, ease: "power2.out" }, s);
  if (e < __DUR__) tl.to(st, { opacity: 0, duration: 0.18, ease: "power1.in" }, e - 0.18);
});

// b-rewind
["#rw-1", "#rw-2", "#rw-3"].forEach((sel, i) =>
  tl.fromTo(sel, { x: -160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 3.45 + i * 0.6));

// b-invite
tl.fromTo("#ticket", { y: 220, rotation: -8, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.6, ease: "back.out(1.6)" }, 5.7);
tl.fromTo("#ticket-shine", { x: -260 }, { x: 1100, duration: 0.9, ease: "power2.inOut" }, 6.5);

// b-ai
tl.fromTo("#lk-abct", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 13.15);
tl.fromTo("#lk-x", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)" }, 13.4);
tl.fromTo("#lk-ai", { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 13.55);
tl.fromTo("#lk-sub", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 14.4);
tl.fromTo("#orb-1", { rotation: 0 }, { rotation: 60, duration: 3.2, ease: "none" }, 13.1);
tl.fromTo("#orb-2", { rotation: 0, scale: 0.9 }, { rotation: -80, scale: 1.05, duration: 3.2, ease: "none" }, 13.1);

// b-prompt: type the prompt, then the chart grows
tl.fromTo("#pw", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 17.8);
tl.fromTo("#prompt-text .pc", { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.028, ease: "none" }, 18.1);
tl.fromTo("#ai-bubble", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, 19.7);
tl.fromTo("#ai-bubble .bar", { scaleY: 0 }, { scaleY: 1, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 19.9);

// b-dates
["#d4", "#d5", "#d6"].forEach((sel, i) =>
  tl.fromTo(sel, { y: 120, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)" }, 26.75 + i * 0.25));

// b-offer: one tick per spoken item
[["#of-1", 28.5], ["#of-2", 29.3], ["#of-3", 31.15]].forEach(([sel, t]) =>
  tl.fromTo(sel, { x: 140, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, t));

// b-price
tl.fromTo("#price", { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power4.out" }, 35.75);
tl.fromTo("#price", { rotation: 0 }, { rotation: -3, duration: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" }, 36.1);

// b-cta: cursor moves to the button and clicks
tl.fromTo("#cta-title", { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 41.65);
tl.fromTo("#cta-btn", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, 41.8);
tl.fromTo("#cta-sub", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 42.2);
tl.fromTo("#cta-cursor", { x: 260, y: 420, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.7, ease: "power2.inOut" }, 42.1);
tl.to("#cta-cursor", { scale: 0.85, duration: 0.08, yoyo: true, repeat: 1 }, 42.85);
tl.to("#cta-btn", { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, 42.85);
tl.fromTo("#cta-ripple", { scale: 0, opacity: 0.8 }, { scale: 14, opacity: 0, duration: 0.7, ease: "power2.out" }, 42.9);
tl.to("#cta-btn", { scale: 1.05, duration: 0.3, yoyo: true, repeat: 2, ease: "sine.inOut" }, 43.4);

window.__timelines["main"] = tl;
"""


def build():
    music_auto = {"version": 1, "lanes": [{"target": "volume", "points": [
        {"t": 0, "v": 0}, {"t": 1.0, "v": MUSIC}, {"t": DUR - 2.5, "v": MUSIC}, {"t": DUR, "v": 0}]}]}
    js = (JS.replace("__BROLL__", json.dumps(BROLL)).replace("__CAPS__", json.dumps([c[:2] for c in CAPTIONS]))
          .replace("__PUNCHES__", json.dumps(PUNCHES)).replace("__DUR__", str(DUR)))
    body = "\n".join([
        '      <div id="aroll-zoom">',
        f'        <video id="aroll" class="clip" src="assets/ad4.mp4" playsinline data-has-audio="true" data-start="0" '
        f'data-duration="{DUR}" data-track-index="0" data-volume="1"></video>',
        '      </div>',
        *[broll_html(*b) for b in BROLL],
        *[caption_html(i, c) for i, c in enumerate(CAPTIONS)],
        f'      <audio id="music" src="assets/audio/music-bed.m4a" data-start="0" data-duration="{DUR}" data-track-index="5" '
        f"data-volume=\"{MUSIC}\" data-automation='{json.dumps(music_auto)}'></audio>",
    ])
    out = f"""<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Ad 4 — ABCT with AI (edit)</title>
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
