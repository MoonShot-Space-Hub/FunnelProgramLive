---
message: "Students who understand AI will leave the rest behind — join the free 3-hour AI masterclass"
mode: autonomous
---

# AD_2 — edit plan

Single A-roll take (`assets/footage/ad2-raw.mp4`) with in-camera whip cuts at 3.667 / 6.167 / 8.017 / 12.55 s.
Everything below is layered over it in `index.html`.

## Frame 1 — Hook (0.00–3.67)
status: animated
rules: spring-pop-entrance (hook chip), coordinate-target-zoom (slow push 1.0 → 1.10)
beat: "In the next few years, there will be two types of students."
b-roll: **B1 2.52–3.50** — students in a classroom / studying on laptops (full-frame cutaway, speaker returns for the whip at 3.6).

## Frame 2 — Two types (3.67–6.17)
status: animated
rules: spring-pop-entrance (✓ / ✗ chips), coordinate-target-zoom (push 1.0 → 1.06)
beat: "One who understands AI and the one who doesn't." — keep the speaker: the phone props carry it.

## Frame 3 — The gap (6.17–8.02)
status: animated
rules: kinetic-beat-slam (MASSIVE caption), camera shake on the impact
beat: "And the gap will be massive." — keep the speaker: the pull-back + raised hands carry it.

## Frame 4 — Offer (8.02–12.55)
status: animated
rules: kinetic-beat-slam (FREE stamp), spring-pop-entrance (3-hour chip), coordinate-target-zoom punches
beat: "We're hosting a free three-hour masterclass where they will learn AI practically."
b-roll: **B2 9.27–10.38** — online class / webinar on a laptop, instructor teaching (FREE + 3-hour chips stay on top).
b-roll: **B3 11.45–12.45** — hands coding on a laptop / AI interface on screen.

## Frame 5 — CTA (12.55–15.05)
status: animated
rules: hw-arrow (registry component), press-release-spring (Register button)
beat: "Click on the link below and register now." — keep the speaker (he points down).

## B-roll treatment

Muted full-frame cutaways above the A-roll and below the gradient, captions and graphics. Each enters with a
0.25 s scale-in (1.12 → 1.0, power3.out) on a whoosh, and cuts straight back to the speaker.

| Slot | Time | Fetch queries (`python3 -I ../../tools/fetch_stock.py assets/broll video "<query>" 4`) |
| ---- | ---- | ---- |
| B1 | 2.52–3.50 | `students classroom`, `students studying laptop`, `college students` |
| B2 | 9.27–10.38 | `online class laptop`, `webinar`, `teacher teaching` |
| B3 | 11.45–12.45 | `coding laptop`, `artificial intelligence`, `typing on laptop` |

## Music

Upbeat, bright, motivational tech / corporate bed, 100–120 BPM, no vocals. Full level 0–0.75 s (before speech) and
after 15.0 s; bed at ~0.12 under the voice, carved with `hyperframes-audio/scripts/carve.mjs`.
Fetch: `python3 -I ../../tools/fetch_stock.py assets/music music "upbeat corporate" 4` (also `motivational`, `tech`).
YouTube Audio Library tracks must be downloaded by the user from YouTube Studio and uploaded.

Licences accepted: Mixkit free licence, Pixabay Content License, Pexels License (all free for commercial use, no
attribution). Record source page + licence per file in `assets/<kind>/<query>/sources.json`.
