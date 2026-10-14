---
format: 1080x1920
duration: 43.32s
message: "The money beliefs you heard growing up quietly shape your decisions. Question them, change the habits, start today with the free one-hour training."
arc: Hook (money is everywhere) → beliefs installed → heard growing up → the three old beliefs → they pull your strings → question them → new habits, today → free training → CTA
audience: Indian adults who feel stuck with money (Instagram Reels)
mode: autonomous
---

<!--
Host (index.html): A-roll assets/avatar-video-2.mp4 plays underneath the whole 43.32 s with punch-in
zooms. Cutaways mount at their global windows and are zoom-blurred in/out by the host. English
captions + black gradient sit on top in y 1150–1480 for the whole video (suppressed during
c4-old-beliefs, whose scene IS the typography). Local times below: 0 = the frame's first frame.
The speaker's face is at y ≈ 540–780 (centre ≈ 500, 660).
-->

## Frame 1 — Money everywhere

- src: compositions/frames/c1-money-abundance.html
- duration: 1.88s
- global: 0.56–2.44
- scene: A glowing gold globe turns while coins and notes stream around it: money is everywhere
- voiceover: "(There's no) shortage of money in this world."
- word_cues: shortage@0.08 of@0.64 money@0.72 in@1.04 this@1.20 world@1.36
- blueprint: compose
- rules: orbit-3d-entry, particle-burst, ambient-glow-bloom, center-outward-expansion
- focal: the gold globe, then the coin stream
- roles: globe = the world; coins and notes = money in abundance

Scene 1 (0.0–0.7): The hook must grab instantly: a large wireframe globe (≈560px, gold latitude and
longitude lines drawn as SVG ellipses, rotating by shifting the meridian ellipses' rx) bursts in from
scale 0.4 with motion blur at centre (540, 600), gold light rays blooming behind it. Coins (≈70–110px,
the frame.md coin) and notes fly outward from behind it (center-outward-expansion), with depth (near
ones bigger and blurrier).
→ Scene 2 (0.7–1.88): on "money"@0.72 a rain of coins pours down through the frame in parallax
layers (seeded positions, each spinning on its Y axis via scaleX), and two orbit rings of coins
circle the globe in perspective (orbit-3d-entry). On "world"@1.36 a cream chip "MONEY IS EVERYWHERE"
(Montserrat 900, +0.14em, gold border) springs in under the globe (y≈1000) with a gold sparkle burst.
Slow camera push.

## Frame 2 — Beliefs installed

- src: compositions/frames/c2-installed-beliefs.html
- duration: 2.44s
- global: 6.76–9.20
- scene: A head in profile has money beliefs downloaded into it like software, ending in a padlock
- voiceover: "It's what we've learned to believe about money."
- word_cues: it's@0.04 what@0.28 we've@0.44 learned@0.76 to@1.16 believe@1.32 about@1.80 money@2.04
- blueprint: compose
- rules: svg-path-draw, stat-bars-and-fills, kinetic-beat-slam, motion-blur-streak
- focal: the head profile and what flows into it
- roles: head = the mind; flowing words = beliefs learned from others; padlock = beliefs locked in

Scene 1 (0.0–1.2): A large side-view head silhouette (facing right, ≈620px tall, x≈200–760,
y≈260–900) draws its outline (svg-path-draw, magenta-hi) over a panel fill. From the left edge,
streams of small mono words fly into the back of the head along curved paths (motion blur):
"MONEY IS HARD", "SAVE, DON'T SPEND", "NOT FOR US", "BE CAREFUL", "RICH = GREEDY". A data readout
"LEARNING..." (JetBrains Mono) ticks under the head.
→ Scene 2 (1.2–2.44): on "believe"@1.32 a progress bar under the head fills fast to 100% with the
readout "BELIEFS INSTALLED 100%" (stat-bars-and-fills); inside the head the brain area glows magenta
and a gold coin rises to its centre. On "money"@2.04 a gold padlock slams shut over the coin
(kinetic-beat-slam) with a click flash and a ripple ring.

## Frame 3 — Rewind to childhood

- src: compositions/frames/c3-rewind-childhood.html
- duration: 2.10s
- global: 11.00–13.10
- scene: A VHS rewind spins the years back to a childhood home where the grown-ups are talking
- voiceover: "Think about the things you heard growing up."
- word_cues: think@0.04 about@0.36 the@0.52 things@0.60 you@0.92 heard@1.08 growing@1.40 up@1.72
- blueprint: compose
- rules: vertical-spring-ticker, spring-pop-entrance, svg-path-draw, sine-wave-loop
- focal: the year counter, then the house and the speech bubbles
- roles: counter = going back in time; house = home; bubbles = what we heard

Scene 1 (0.0–0.9): Retro rewind: a cream "REWIND" label with two drawn rewind triangles (SVG) blinks
at the top (y≈200), faint horizontal tracking lines and a slight RGB-split jitter (deterministic) on
the stage, and a big year counter (JetBrains Mono 700, ≈170px) rolls backward fast
(vertical-spring-ticker) from 2026 to 1998, landing with overshoot.
→ Scene 2 (0.9–2.10): the counter shrinks up into a small chip and a warm childhood scene draws in
(svg-path-draw): a simple house silhouette with glowing gold windows, a small child silhouette in
the foreground and two tall adult silhouettes beside it. On "heard"@1.08 three speech bubbles pop
from the adults (spring-pop-entrance) holding only animated "..." dots (the words come next frame).
On "growing up"@1.40 the child grows slightly taller (scale step) and the house light breathes
(sine-wave-loop). Slow push in toward the bubbles.

## Frame 4 — The old beliefs (kinetic typography)

- src: compositions/frames/c4-old-beliefs.html
- duration: 5.92s
- global: 13.10–19.02
- scene: The three beliefs she heard slam in as big quote cards, word by word, and stack up like weights
- voiceover: "Money hard to earn. Wanting more is selfish. People like us can never be wealthy."
- word_cues: money@0.10 hard@0.74 to@1.06 earn@1.22 wanting@1.78 more@2.18 is@2.50 selfish@2.74 people@3.62 like@3.94 us@4.18 can@4.50 never@4.74 be@4.98 wealthy@5.22
- blueprint: compose
- rules: kinetic-beat-slam, spring-pop-entrance, motion-blur-streak, ambient-glow-bloom
- focal: the current belief card's words as they are spoken
- roles: quote cards = the beliefs; red words = the limiting part; stack = their weight

The host shows NO captions during this frame: the scene's typography carries the words, so every
spoken word must appear in sync and stay readable. Each card is a speech-bubble card (frame.md card +
a tail, drawn opening/closing quote marks as shapes) with a small chip above it "HEARD AT HOME".
Words are Archivo Black ≈96–120px cream; the limiting words HARD, SELFISH, NEVER are red with a red
glow and a red underline bar that wipes in.
Scene 1 (0.0–1.7): card 1 slams in centre-high (y≈260–560) on "money"@0.10; words appear on their
cues: "MONEY" @0.10, "HARD" @0.74 (red, kinetic-beat-slam with a small screen shake), "TO EARN." @1.06–1.22.
→ Scene 2 (1.7–3.5): card 1 drops down and darkens one step (y≈640–840, scale 0.82, it is now
weight at the bottom of the stack), card 2 slams in at the top: "WANTING" @1.78 "MORE" @2.18 "IS" @2.50
"SELFISH." @2.74 (red).
→ Scene 3 (3.5–5.92): cards 1 and 2 both shift down into a compact stack (y≈700–1100, slight
alternating rotations ±3°), card 3 (larger) slams in at the top: "PEOPLE LIKE US" @3.62–4.18,
"CAN" @4.50, "NEVER" @4.74 (red, the biggest hit: red flash + shake + glow bloom), "BE WEALTHY." @4.98–5.22.
Heavy chain links draw across the stack on "never"@4.74. Echo ripple rings pulse behind each slam.

## Frame 5 — Strings on your decisions

- src: compositions/frames/c5-shaping-decisions.html
- duration: 3.60s
- global: 21.30–24.90
- scene: Old beliefs work like puppet strings, quietly steering a person away from the door marked GROW
- voiceover: "(it can) start shaping your decisions without you even realizing it."
- word_cues: start@0.06 shaping@0.30 your@0.86 decisions@1.02 without@1.74 you@2.22 even@2.38 realizing@2.70 it@3.26
- blueprint: compose
- rules: svg-path-draw, spring-pop-entrance, sine-wave-loop, motion-blur-streak
- focal: the figure and the two doors
- roles: control bar words = beliefs; strings = their pull; doors = choices; figure = you

Scene 1 (0.0–1.0): Two tall glowing doorways stand on a floor plane (y≈420–1000): left door
"SAFE" (dim, cool), right door "GROW" (warm gold light spilling out, rays). A person silhouette (cream,
≈380px) stands between them in front. From above, a marionette control bar made of three red
word-chips "CAN'T", "SELFISH", "NEVER" drops in (y≈170) with motion blur, and thin cream strings draw
down (svg-path-draw) to the figure's head and hands on "shaping"@0.30.
→ Scene 2 (1.0–3.60): on "decisions"@1.02 the figure starts to step toward GROW, then the control bar
tilts and the strings pull the figure back toward SAFE (keyframed poses, overshoot); the GROW door's
light dims a little. On "without you even realizing"@1.74–2.70 a glint travels down each string and
a small mono chip "AUTOPILOT" blinks on near the figure (sine-wave-loop blink, deterministic). The
strings sway gently throughout.

## Frame 6 — Question the old beliefs

- src: compositions/frames/c6-question-beliefs.html
- duration: 2.82s
- global: 29.10–31.92
- scene: A magnifying glass inspects the old belief cards, a giant question mark lands, and they crack
- voiceover: "But you can start questioning those old beliefs."
- word_cues: but@0.10 you@0.34 can@0.58 start@0.82 questioning@1.14 those@1.78 old@1.94 beliefs@2.26
- blueprint: compose
- rules: spring-pop-entrance, kinetic-beat-slam, svg-path-draw, ambient-glow-bloom
- focal: the giant question mark over the cards
- roles: cards = the old beliefs; magnifier = questioning; cracks = beliefs losing their hold

Scene 1 (0.0–1.1): The three belief cards from Frame 4 (same card style and text: "MONEY HARD TO
EARN", "WANTING MORE IS SELFISH", "PEOPLE LIKE US CAN NEVER BE WEALTHY", smaller ≈56–64px, now faded
sepia/dusty with a "OLD" stamp feel) fan out across the stage (y≈380–980). A large magnifying glass
(SVG, gold rim, glass with a lens-magnify effect: a scaled copy of the text under the lens)
sweeps across them.
→ Scene 2 (1.1–2.82): on "questioning"@1.14 a giant gold "?" (Archivo Black ≈420px, glow) slams in
over the cards (kinetic-beat-slam) with a light sweep and glow bloom. On "old"@1.94 crack lines draw
across each card (svg-path-draw, cream/gold) and on "beliefs"@2.26 the cards split slightly along the
cracks (pieces nudge apart a few px with rotation), dust particles puff.

## Frame 7 — New habits, begin today

- src: compositions/frames/c7-new-habits-today.html
- duration: 4.58s
- global: 31.92–36.50
- scene: A broken habit loop re-forms into a rising staircase, then a calendar page flips to TODAY
- voiceover: "You can change the habits they've created, and that's something you can begin today."
- word_cues: you@0.16 can@0.32 change@0.56 the@0.88 habits@0.96 they've@1.44 created@1.84 and@2.40 that's@2.64 something@2.96 you@3.36 can@3.60 begin@3.76 today@4.16
- blueprint: compose
- rules: svg-path-draw, stat-bars-and-fills, spring-pop-entrance, particle-burst, kinetic-beat-slam
- focal: the loop becoming the staircase, then the TODAY page
- roles: loop = old habit cycle; staircase = new habits compounding; calendar = start now

Scene 1 (0.0–2.4): A circular habit loop (≈520px, thick red-tinted arrow ring rotating, with three
small icon nodes on it drawn as SVG: a wallet, a closed hand, a stop sign) spins at centre (540, 560).
On "change"@0.56 the loop snaps open (the ring's stroke unravels, svg-path-draw reverse) and its
segment re-forms into a gold rising staircase of 5 steps with an arrow climbing it (stat-bars-and-fills
style step rises, staggered), on "habits"@0.96 the steps light up one by one; a chip "NEW HABITS"
springs in (y≈220).
→ Scene 2 (2.4–4.58): the staircase slides up and shrinks; a large tear-off calendar page (≈520×560
card, gold binding rings) drops in at centre (y≈380–940) showing a mono date; on "begin"@3.76 the page
flips (rotateX, perspective) to reveal "TODAY" (Archivo Black ≈150px gold, glow) and on "today"@4.16
a round gold stamp "DAY 1" slams on its corner (kinetic-beat-slam) with a gold particle burst.

## Frame 8 — Free one-hour training

- src: compositions/frames/c8-free-training.html
- duration: 2.20s
- global: 39.90–42.10
- scene: A premium training card: play button, a clock ring sweeping one hour, and a FREE stamp
- voiceover: "Start with the free one hour training."
- word_cues: start@0.10 with@0.42 the@0.66 free@0.82 one@1.22 hour@1.54 training@1.78
- blueprint: compose
- rules: split-tilt-cards, kinetic-beat-slam, svg-path-draw, ambient-glow-bloom
- focal: the training card, then the FREE stamp
- roles: card = the offer; clock = one hour; stamp = free

Scene 1 (0.0–0.8): A large card (x≈110–970, y≈300–940) tilts in from 3D (split-tilt-cards style
entry) with a light sweep: a video-lesson screen area with a big round play button (gold, pulsing
ring), title "MONEY BELIEFS" small chip above, and the title "1-HOUR TRAINING" (Archivo Black ≈96px
cream) below the screen.
→ Scene 2 (0.8–2.20): on "free"@0.82 a big "FREE" stamp (Archivo Black ≈200px, gold with glow, rotated
−8°) slams onto the card's top-right corner (kinetic-beat-slam) with a gold particle burst. On
"one hour"@1.22–1.54 a clock ring around the play button sweeps a full 60-minute arc (svg-path-draw)
with a mono readout "60:00". On "training"@1.78 the title gets a gold underline wipe.

## Frame 9 — CTA overlay (transparent, over the speaker)

- src: compositions/frames/cta-click-link.html
- duration: 1.28s
- global: 42.04–43.32
- overlay: TRANSPARENT — no full-bleed ground; the speaker footage shows through. Her face is at
  y≈540–780: keep that band clear. Content only in the top band y 120–440 and the torso band
  y 860–1120.
- scene: A "CLICK THE LINK BELOW" button springs up over the speaker and a cursor taps it, chevrons bounce down
- voiceover: "Click the link below."
- word_cues: click@0.12 the@0.52 link@0.60 below@0.84
- blueprint: compose
- rules: spring-pop-entrance, press-release-spring, cursor-click-ripple, sine-wave-loop
- focal: the button
- roles: chip = the offer reminder; button = the action; chevrons = direction

Scene 1 (0.0–1.28): Immediately at 0.0 a chip "FREE 1-HOUR TRAINING" (gold border, Montserrat 700,
dark translucent backing) springs in at the top (y≈220–310) with a sheen. On "click"@0.12 a large pill
button "CLICK THE LINK BELOW" (Montserrat 900 ≈52px, cream on a magenta→gold gradient, gold border,
glow) springs up in the torso band (y≈900–1020); a hand-cursor (SVG) glides in and taps it on
"link"@0.60 (press-release-spring + cursor-click-ripple); three gold chevrons (SVG) bounce downward
under it (y≈1040–1120, staggered sine bounce) from "below"@0.84 to the end. The scene holds to the
last frame (it is the final scene).
