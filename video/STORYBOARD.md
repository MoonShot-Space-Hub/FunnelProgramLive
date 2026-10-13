---
format: 1080x1920
duration: 51.76s
message: "Picture your future self: the number in your account matters, but so does the voice in your head. Don't wait to change it."
arc: Hook (close your eyes) → Picture the future → The real question → Two voices → Nothing changed but the date → Number vs voice → Two futures → CTA
audience: retail traders / investors following a coaching programme (Instagram Reels)
mode: autonomous
---

<!--
Orchestration (index.html, built by the orchestrator, not by frame workers):
- A-roll assets/avatar-video-1.mp4 plays the whole 51.76s underneath, with punch-in zooms between cutaways.
- Each cutaway below mounts at its global window over the A-roll; the host zoom-blurs it in and out.
- Captions + black gradient sit on top of everything in y 1150–1480, except 34.75–38.15 (Frame 5's
  kinetic phase carries the words) and the CTA (50.00–51.76).
- Times inside each frame's shot sequence are LOCAL seconds (0 = the frame's first frame).
-->

## Frame 1 — Three years from now

- src: compositions/frames/b1-three-years.html
- duration: 4.40s
- global: 2.10–6.50
- transition_in: eyelid blink (host)
- scene: A year ring rolls 2026 → 2029, then a phone rises showing a hidden balance
- voiceover: "Now, picture yourself three years from now checking your bank balance."
- word_cues: Now@0.06 picture@0.62 yourself@1.10 three@1.66 years@1.98 from@2.30 now@2.46 checking@2.86 your@3.26 bank@3.42 balance@3.74
- blueprint: compose
- rules: svg-path-draw, vertical-spring-ticker, ambient-glow-bloom, motion-blur-streak, spring-pop-entrance
- focal: the year, then the phone's hidden balance
- roles: ring + ticks = time; year = the future date; phone = checking the balance; blurred digits = fear of looking

Scene 1 (0.0–1.6): Ground up. A large thin ring (r≈330, violet-hi stroke 4px, centred x540 y600) draws itself
(svg-path-draw) while 60 tick marks around it fade in and rotate slowly. Inside, a small mono label "TODAY"
above a hero year "2026" (Archivo Black ~230px, cream). Slow camera push on the whole stage.
→ Scene 2 (1.6–2.8): on "three"@1.66 the year's digit columns roll like a slot machine (vertical-spring-ticker)
2026 → 2027 → 2028 → 2029, one spring step each (~0.22s), with motion blur on each step and the ring's tick
layer rotating with every step. On "years"@1.98 the label swaps to an amber pill "+3 YEARS". The landed "2029"
turns amber with glow; an amber glow blooms behind it (ambient-glow-bloom).
→ Scene 3 (2.8–4.4): on "checking"@2.86 the ring + year shrink and lift to the top of the stage (y≈260, scale≈0.42)
while a phone rises from below (y +900 → 0, rotation 8° → 0, motion-blur-streak) and lands centred (top ≈ y380,
bottom ≤ y1110). Screen: small header "MY ACCOUNT", mono label "AVAILABLE BALANCE", and a balance row of
bullets "●●,●●,●●●" heavily blurred (blur ~14px) with a shimmer sweep and an eye-slash icon. On "balance"@3.74
the blurred row pulses once and a small amber "?" badge springs onto the phone corner (spring-pop-entrance).

## Frame 2 — Opening the account

- src: compositions/frames/b2-balance-unknown.html
- duration: 3.80s
- global: 15.10–18.90
- transition_in: zoom-blur (host)
- scene: Fingerprint unlock, then the balance digits spin and land on question marks
- voiceover: "Your future self, opening that account, looking at the balance."
- word_cues: Your@0.10 future@0.34 self@0.74 opening@1.30 that@1.78 account@1.94 looking@2.50 at@2.82 the@2.98 balance@3.14
- blueprint: compose
- rules: svg-path-draw, vertical-spring-ticker, spring-pop-entrance, motion-blur-streak, depth-of-field-blur
- focal: the fingerprint, then the "?" balance
- roles: fingerprint = your future self unlocking; digits = the balance; "?" = you don't know yet

Scene 1 (0.0–1.3): A large card (≈900×900, y≈170–1070) fills the stage like a phone screen up close. A mono chip
"2029 · FUTURE YOU" top-left. A fingerprint (≈10 concentric arcs, violet-hi stroke 5px, ≈420px) draws itself
arc by arc (svg-path-draw) from "future"@0.34 to "self"@0.74 and keeps a slow scan line moving over it.
→ Scene 2 (1.3–2.5): on "opening"@1.30 the fingerprint fills amber, an amber ripple ring expands from it, then an
inner zoom-through: the fingerprint scales up and blurs out while the account panel scales in from 0.85 with blur
(header "ACCOUNT", mono label "BALANCE" + a thin divider). "account"@1.94 lands the panel.
→ Scene 3 (2.5–3.8): on "looking"@2.50 a row of 7 digit columns (Archivo Black ≈150px, grouped "0,00,000")
spins fast (vertical-spring-ticker, staggered start, motion blur while spinning). On "balance"@3.14 every column
lands on "?" — the row reads "?,??,???" in amber with glow, a short shake, and a light sweep across it. The card
edge glows; background stays softly out of focus (depth-of-field-blur).

## Frame 3 — Something goes wrong

- src: compositions/frames/b3-chart-crash.html
- duration: 1.90s
- global: 20.95–22.85
- transition_in: staggered blocks (host)
- scene: A rising price line crashes red with a glitch hit
- voiceover: "When something goes wrong, how does…"
- word_cues: When@0.09 something@0.33 goes@0.73 wrong@1.05 how@1.61 does@1.85
- blueprint: compose
- rules: svg-path-draw, chromatic-glitch, multi-phase-camera, spring-pop-entrance
- focal: the line's tip and its price tag
- roles: line = your trade; red crash = something goes wrong

Scene 1 (0.0–1.0): A trading chart fills the stage: hairline grid, a few faint candle bars, mono axis labels.
An amber glowing line draws from left to right climbing steadily (svg-path-draw, 0.0–0.95) with a mono price tag
pill riding the tip ("+8.2%", amber). Slow camera push.
→ Scene 2 (1.0–1.9): on "wrong"@1.05 the line's last segment drops steeply in red (draws in ~0.25s), the whole
chart takes an RGB-split + slice glitch for ~0.3s (chromatic-glitch, quantized-time hash), a short deterministic
camera shake, the tag flips red "−18.6%", and a red alert triangle springs in beside it (spring-pop-entrance).
A red edge vignette pulses once. Hold the crashed state to the end.

## Frame 4 — Two voices

- src: compositions/frames/b4-two-voices.html
- duration: 3.85s
- global: 25.55–29.40
- transition_in: zoom-blur (host)
- scene: Kindness card vs harsh-voice card, stacked, with a VS badge
- voiceover: "With kindness or with the same harsh voice you use today?"
- word_cues: With@0.05 kindness@0.37 or@1.17 with@1.41 the@1.57 same@1.73 harsh@2.05 voice@2.53 you@2.85 use@3.01 today@3.33
- blueprint: compose
- rules: split-tilt-cards, spring-pop-entrance, sine-wave-loop, chromatic-glitch, depth-of-field-blur
- focal: the KINDNESS card, then the HARSH VOICE card
- roles: top card = kind inner voice; bottom card = harsh inner voice; waveforms = the voice itself

Scene 1 (0.0–1.2): Top card (y≈150–590, full stage width) sweeps in from the left with a 3D tilt (split-tilt-cards,
rotationY +14° → 0, x −700 → 0, motion blur). Violet→amber border glow, word "KINDNESS" (Archivo Black ≈110px,
amber with glow) lights up on "kindness"@0.37, a smooth sine waveform runs across the card (sine-wave-loop),
mono chip "INNER VOICE · CALM".
→ Scene 2 (1.2–2.4): a round "VS" badge springs in between the cards (y≈620) on "or"@1.17 (spring-pop-entrance).
Bottom card (y≈650–1100) slams in from the right (rotationY −14° → 0, x +700 → 0) on "same"@1.73: red border,
word "HARSH VOICE" (Archivo Black ≈96px, red) on "harsh"@2.05, a jagged spiky waveform with RGB-split flicker
(chromatic-glitch), mono chip "INNER VOICE · CRITIC".
→ Scene 3 (2.4–3.85): on "voice"@2.53 the harsh card shakes briefly; on "today"@3.33 a light sweep crosses the
kindness card and its glow brightens while the harsh card dims and softens slightly (depth-of-field-blur ~2px).
Both cards stay visible to the end.

## Frame 5 — Nothing changed but the date

- src: compositions/frames/b5-same-date.html
- duration: 5.75s
- global: 32.40–38.15
- transition_in: zoom-blur (host)
- captions: suppressed by the host from local 2.35 to the end — this frame's kinetic words ARE the captions there
- scene: Calendar page flips 2026 → 2029 while everything else stays the same, then kinetic type SAME VOICE / SAME HABITS / +3 YEARS
- voiceover: "nothing's really changed except the date. Same voice, same habits, just three years later."
- word_cues: nothing's@0.08 really@0.64 changed@0.88 except@1.28 the@1.60 date@1.76 Same@2.40 voice@2.72 same@3.36 habits@3.76 just@4.40 three@4.64 years@5.04 later@5.28
- blueprint: compose
- rules: kinetic-beat-slam, 3d-text-depth-layers, motion-blur-streak, spring-pop-entrance
- focal: the calendar year, then the kinetic words
- roles: calendar = time passing; unchanged icon row = nothing else changed; kinetic words = the spoken line

Scene 1 (0.0–2.3): A tear-off desk calendar card (≈620×700, centred, y≈180–880): red-violet top binding with two
rings, mono "OCT" and a big "2026" (Archivo Black ≈220px, cream). Below it a row of three small line icons (phone,
coffee cup, speech bubble) in mute with a mono label "UNCHANGED" — they never change. On "date"@1.76 the page
tears off: it flips forward in 3D (rotationX 0 → −110°, transform-origin top) with blur and falls away, revealing
"2029" in amber underneath (spring settle + glow). Slow camera push.
→ Scene 2 (2.3–5.75) kinetic-beat-slam, the words exactly on their cues, three stacked lines in the stage
(line 1 y≈260, line 2 y≈560, line 3 y≈860), Archivo Black ≈200–240px: at 2.30 the calendar zooms through
(scale up + blur out). "SAME"@2.40 scale-slams in (cream, with 3d-text-depth-layers extrusion in violet), "VOICE."
@2.72 snaps in beside/below it in amber. "SAME"@3.36 + "HABITS."@3.76 side-snap in as line 2 (line 1 dims to 55%).
"+3"@4.64 and "YEARS"@5.04 rise-rotate in as line 3 in amber with glow (lines 1–2 dim). Small mono "LATER"
ticks in on "later"@5.28. Motion blur on every slam; a hairline beat bar pulses on each hit.

## Frame 6 — The number and the voice

- src: compositions/frames/b6-number-vs-voice.html
- duration: 5.05s
- global: 40.00–45.05
- transition_in: staggered blocks (host)
- scene: A balance number counts up, then the camera pans to a head silhouette with a glowing voice waveform inside
- voiceover: "Because it's not just about the number in your account, it's also about the voice in your head."
- word_cues: Because@0.08 it's@0.40 not@0.72 just@0.88 about@1.12 the@1.36 number@1.52 in@1.84 your@2.00 account@2.24 it's@2.88 also@3.20 about@3.44 the@3.68 voice@3.84 in@4.24 your@4.40 head@4.56
- blueprint: compose
- rules: counting-dynamic-scale, stat-bars-and-fills, viewport-change, svg-path-draw, sine-wave-loop, depth-of-field-blur
- focal: the counting number, then the head with the waveform
- roles: number = money in the account; head + waveform = the inner voice

Scene 1 (0.0–2.8): Upper stage. A bank-card style frame (≈880×420, y≈170–590) assembles: outline draws
(svg-path-draw) on "Because"@0.08, chip + mono "ACCOUNT" label. On "number"@1.52 an amber pill "THE NUMBER"
pops and a big counter (Archivo Black ≈170px, cream, tabular, Indian grouping) counts 0 → 25,00,000 with
growing scale (counting-dynamic-scale) between 1.5 and 2.6; a progress bar under it fills to 82%
(stat-bars-and-fills). "account"@2.24 lands a glint across the card.
→ Scene 2 (2.8–5.05): on "also"@3.20 a virtual camera move (viewport-change) shifts focus down: the card scales to
0.8, drifts up and blurs/dims (depth-of-field-blur), while a head silhouette in profile (≈520px tall, y≈560–1100)
draws its outline in violet-hi (svg-path-draw). On "voice"@3.84 an amber pill "THE VOICE" pops and a waveform of
~24 vertical bars inside the head starts moving (sine-wave-loop, deterministic phase per bar). On "head"@4.56 the
bars swell amber and the head outline glows. Both elements stay on screen.

## Frame 7 — Two futures

- src: compositions/frames/b7-two-futures.html
- duration: 3.60s
- global: 46.40–50.00
- transition_in: zoom-blur (host)
- scene: Two paths fork into the distance; a DON'T WAIT stamp slams; the light takes the amber path
- voiceover: "future you're heading towards, don't wait to start making a change."
- word_cues: future@0.08 you're@0.48 heading@0.72 towards@1.12 don't@1.60 wait@1.92 to@2.24 start@2.40 making@2.64 a@2.96 change@3.12
- blueprint: compose
- rules: svg-path-draw, kinetic-beat-slam, particle-burst, motion-blur-streak
- focal: the fork, then the DON'T WAIT stamp, then the amber path
- roles: left path = the same future; right path = the changed future; glowing dot = you

Scene 1 (0.0–1.5): A perspective ground plane: two paths start together at the stage bottom (x540 y≈1110) and
diverge toward two vanishing points high in the stage (left ≈ x260 y≈300, right ≈ x820 y≈300), drawn with
svg-path-draw; dashed centre marks stream toward the horizon (forward motion). Left path grey-violet, fading
into fog, mono label "SAME"; right path amber glowing, mono label "CHANGE". A glowing dot travels up the shared
stem and hesitates at the fork on "towards"@1.12.
→ Scene 2 (1.5–2.6): on "don't"@1.60 a stamp "DON'T WAIT" (Archivo Black ≈170px, two lines, cream with amber
outline glow) slams in over the upper stage (scale 2.4 → 1, rotation −6°, motion blur), with a shockwave ring,
an amber particle burst (particle-burst, seeded) and a short deterministic camera shake (stage x/y offsets from a fixed table, ~0.25s).
→ Scene 3 (2.6–3.6): on "start"@2.40/"making"@2.64 the dot shoots along the amber path toward its vanishing
point (motion-blur-streak); the amber path flares brighter with chevrons pulsing along it, the grey path dims.
On "change"@3.12 the right vanishing point blooms amber. The stamp stays.

## CTA — orchestrator-built in index.html (not a frame packet)

- duration: 1.76s
- global: 50.00–51.76
- scene: Over the speaker: JOIN US slams in the caption band, a CLICK THE LINK BELOW button springs up, chevrons bounce downward
- voiceover: "Join us. Click the link below."
