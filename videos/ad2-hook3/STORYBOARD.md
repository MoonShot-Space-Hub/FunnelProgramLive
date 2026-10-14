---
format: 1080x1920
duration: 52.37s
message: "Trading is just like garba: when the song changes, you change your steps. Learn the systematic approach in a free one-hour masterclass."
arc: Hook (trading = garba) → Navratri, songs and steps → trends change → loss if you don't adapt → systematic approach → Step 1 → bundle, free → CTA
audience: retail traders in India (Instagram Reels, Navratri season)
mode: autonomous
---

<!--
Host (index.html): A-roll assets/ad2-hook3.mp4 plays underneath the whole 52.37 s with punch-in zooms.
Cutaways mount at their global windows and are zoom-blurred in/out by the host. English captions
+ black gradient sit on top in y 1150–1480 for the whole video. The loss beat (17.42–19.42) reuses
the 3D chart-crash scene. Local times below: 0 = the frame's first frame.
-->

## Frame 1 — Navratri night

- src: compositions/frames/g1-navratri-ring.html
- duration: 2.90s
- global: 2.48–5.38
- scene: A Navratri night opens: a glowing garbo at the centre, dancers circling it under string lights
- voiceover: "If you've ever been to Navratri,"
- word_cues: if@0.04 you've@0.32 ever@0.92 been@1.36 to@1.80 navratri@2.08
- blueprint: compose
- rules: center-outward-expansion, orbit-3d-entry, svg-path-draw, ambient-glow-bloom, sine-wave-loop
- focal: the garbo, then the ring of dancers
- roles: garbo = the heart of garba; dancers = the market crowd moving to the rhythm; lights = the festival

Scene 1 (0.0–1.3): From darkness, string-light bokeh fades up across the top, a large rangoli ring draws
itself (svg-path-draw) around centre (540, 640), and a garbo (clay pot with rows of glowing holes, ≈300px)
rises into the centre with its inner flame flickering (deterministic sine flicker) and gold light rays
blooming behind it (ambient-glow-bloom).
→ Scene 2 (1.3–2.9): 8 dancer silhouettes (chaniya choli, dandiya raised) expand outward from the
garbo into a tilted ring around it (center-outward-expansion), then orbit it in a perspective ellipse
(orbit-3d-entry) while each sways through a step cycle (sine-wave-loop, phase per dancer). On
"navratri"@2.08 a cream title chip "NAVRATRI" (Montserrat 900, +0.14em, marigold border) pops above the
garbo with a gold sparkle burst. Slow camera push.

## Frame 2 — Different songs, different steps

- src: compositions/frames/g1-songs-steps.html
- duration: 4.20s
- global: 5.38–9.58
- scene: Each new song brings new steps: song chips switch while footprint patterns change, then the rhythm waveform locks in
- voiceover: "different songs, different steps. Every song has its own rhythm."
- word_cues: different@0.02 songs@0.06 different@0.58 steps@1.42 every@2.30 song@2.65 has@2.94 its@3.18 own@3.42 rhythm@3.66
- blueprint: compose
- rules: vertical-spring-ticker, waterfall-entry, svg-path-draw, sine-wave-loop, spring-pop-entrance
- focal: the song ticker and the dance-step footprints
- roles: song chip = the market regime; footprints = your strategy steps; waveform = rhythm

Scene 1 (0.0–1.4): Upper stage: a card with a vinyl/music-note icon and a slot-machine song ticker
(vertical-spring-ticker) rolling "SONG 1 → SONG 2 → SONG 3" on the beat (0.06, 0.58, 1.10). Below it,
footprint marks (pairs of feet) appear in a pattern (waterfall-entry); each time the song ticks, the
footprints re-form into a different pattern: a circle, then a zig-zag, then a spin (three distinct
layouts, crossfaded with motion).
→ Scene 2 (1.4–2.3): on "steps"@1.42 the footprints flash marigold and a chip "NEW STEPS" springs in
(spring-pop-entrance).
→ Scene 3 (2.3–4.2): on "rhythm"@3.66 (build from "every"@2.30) a glowing rhythm waveform draws across
the stage (svg-path-draw) and pulses in a 6/8 pattern (sine-wave-loop, deterministic), with dandiya sticks
clicking at its peaks (small gold spark on each click). Ambient bokeh and slow push throughout.

## Frame 3 — Trends change

- src: compositions/frames/g2-trends-change.html
- duration: 4.76s
- global: 9.58–14.34
- scene: The market's song changes: one chart line morphs from uptrend to downtrend to sideways
- voiceover: "Same way, market trends change. Uptrend to downtrend, downtrend to sideways."
- word_cues: same@0.02 way@0.50 market@0.89 trends@1.54 change@1.86 uptrend@2.58 to@3.03 downtrend@3.22 downtrend@3.70 to@4.12 sideways@4.26
- blueprint: compose
- rules: svg-path-draw, chart-scrub-readout, spring-pop-entrance, motion-blur-streak
- focal: the morphing trend line and its state label
- roles: line = the market; green/red/gold = uptrend/downtrend/sideways

Scene 1 (0.0–2.5): A large chart card (stage-wide, y≈220–960) on festive ground: hairline grid, faint
candles. On "market"@0.89 a line draws in (svg-path-draw); on "trends"@1.54/"change"@1.86 a mandala
pulse ripples behind the card (the song changing).
→ Scene 2 (2.5–4.76): the SAME line morphs between three shapes on the cues: "uptrend"@2.58 → rising
line in green #2BD27A with label chip "UPTREND ↗"; "downtrend"@3.22 → falling line in red #FF3B4E,
chip "DOWNTREND ↘" (motion-blur-streak on the swap); "sideways"@4.26 → flat ranging line in gold, chip
"SIDEWAYS →". A readout dot rides the line's end (chart-scrub-readout). Each chip springs in
(spring-pop-entrance); the previous chip slides away inside the card. A dancer silhouette at the
card's corner changes its pose with each state (small, decorative).

## Frame 4 — Step 1

- src: compositions/frames/g4-step-one.html
- duration: 5.32s
- global: 24.60–29.92
- scene: STEP 1 checklist: entry, exit, stop loss, target slam in, then the three trend types
- voiceover: "Step 1 — entry, exit, stop loss, target. What's an uptrend, a downtrend, a sideways trend?"
- word_cues: step@0.12 1@0.28 entry@0.76 exit@1.08 stop@1.56 loss@1.80 target@2.12 uptrend@2.76 downtrend@3.56 sideways@4.36 trend@4.68
- blueprint: compose
- rules: kinetic-beat-slam, stat-bars-and-fills, spring-pop-entrance, svg-icon-enrichment
- focal: the STEP 1 badge, then the four checklist cards
- roles: badge = the system; cards = the four rules; icons = trend types

Scene 1 (0.0–2.4): A "STEP 1" badge (Archivo Black ≈150px in a marigold-bordered circle with a spinning
dashed mandala ring) scale-slams in at the top on "step"@0.12. Four cards (2×2 grid, y≈420–860) slam in
on their cues (kinetic-beat-slam): ENTRY @0.76 (green arrow-in icon), EXIT @1.08 (arrow-out), STOP LOSS
@1.56 (red shield/stop icon), TARGET @2.12 (bullseye). Each card gets a checkmark that draws itself
right after it lands, and a gold sweep.
→ Scene 2 (2.4–5.32): the cards compact upward (scale 0.82) and a row of three trend icon tiles springs in
below (y≈900–1100): ↗ UPTREND @2.76 (green), ↘ DOWNTREND @3.56 (red), → SIDEWAYS @4.36 (gold); each icon's
inner line draws (svg-icon-enrichment) and the tile pulses on its cue.

## Frame 5 — The bundle, absolutely free

- src: compositions/frames/g5-bundle-free.html
- duration: 7.62s
- global: 36.48–44.10
- scene: Masterclass + risk management + mind management stack into a bundle, then a FREE stamp with a marigold burst
- voiceover: "One masterclass, you learn everything — plus risk management and mind management. And it's absolutely free."
- word_cues: one@0.04 masterclass@0.48 everything@1.52 plus@2.16 risk@2.72 management@2.88 mind@3.84 management@4.08 absolutely@6.12 free@6.88
- blueprint: compose
- rules: split-tilt-cards, spring-pop-entrance, particle-burst, kinetic-beat-slam, ambient-glow-bloom
- focal: the stacked bundle, then the FREE stamp
- roles: cards = what you get; stamp = the offer

Scene 1 (0.0–2.0): A large hero card "MASTERCLASS" (with a play/screen icon and a "1 HOUR" chip) tilts in
from 3D (split-tilt-cards style entry) on "masterclass"@0.48; light sweep; "everything"@1.52 sparkles
mirror-work dots around it.
→ Scene 2 (2.0–5.4): a "+" springs in on "plus"@2.16; a "RISK MANAGEMENT" card (shield icon) slides in on
"risk"@2.72 and docks under the first; a second "+"; a "MIND MANAGEMENT" card (brain/lotus icon) on
"mind"@3.84 docks under it. The three cards settle into a fanned stack (slight rotations) with a gold
bundle ribbon wrapping them.
→ Scene 3 (5.4–7.62): on "absolutely"@6.12 the stack dims slightly and a big "FREE" stamp (Archivo Black
≈220px, marigold with gold outline glow, rotated −8°) slams in on "free"@6.88 (kinetic-beat-slam) with a
marigold-petal particle burst (particle-burst, seeded) and a glow bloom.

## Frame 6 — CTA overlay (transparent, over the speaker)

- src: compositions/frames/cta-book-seat.html
- duration: 8.01s
- global: 44.36–52.37
- overlay: TRANSPARENT — no full-bleed ground; the speaker footage shows through. His face is at
  y≈450–830: keep that band clear. Content only in the top band y 120–400 and the torso band y 860–1120.
- scene: Festive CTA over the speaker: a toran garland across the top, a FREE 1-HOUR MASTERCLASS chip, then a BOOK YOUR SEAT button with bouncing arrows
- voiceover: "So click on the link and check out this one hour masterclass where you learn step by step process to become a systematic trader. So click on the link and book your seat right now."
- word_cues: click@0.20 link@0.60 one@1.48 hour@1.72 masterclass@1.96 systematic@4.92 trader@5.48 click@6.28 link@6.68 book@7.00 seat@7.40 now@7.80
- blueprint: compose
- rules: spring-pop-entrance, press-release-spring, cursor-click-ripple, sine-wave-loop
- focal: the masterclass chip, then the BOOK YOUR SEAT button
- roles: toran = festive frame; chip = the offer; button = the action

Scene 1 (0.0–3.0): A marigold toran garland (strings of orange/gold flowers with small mango leaves)
drops in across the very top (y 0–150, swinging gently, sine-wave-loop) with string lights twinkling.
On "one hour masterclass"@1.48–1.96 a chip "FREE · 1-HOUR MASTERCLASS" springs in at y≈220–320
(spring-pop-entrance) with a sheen.
→ Scene 2 (3.0–6.2): on "systematic trader"@4.92 a small badge "BECOME A SYSTEMATIC TRADER" ticks in
under the chip (y≈330–390).
→ Scene 3 (6.2–8.01): on "click"@6.28 a large pill button "BOOK YOUR SEAT" (Montserrat 900, cream on a
crimson→marigold gradient, gold border) springs up in the torso band (y≈930–1050); a hand-cursor taps it
on "book"@7.00 (press-release-spring + cursor-click-ripple); three marigold chevrons bounce downward
under it (y≈1060–1120); on "now"@7.80 a gold sparkle burst.
