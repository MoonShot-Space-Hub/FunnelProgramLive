---
workflow: general-video
flow: automation
storyboard: no
message: "Trading is just like garba: when the song changes, you change your steps. Learn the systematic approach in a free one-hour masterclass."
destination: instagram-reels
aspect: 1080x1920
language: en
length: 52.36s
angle: footage-remix
---

## Intent

Edit Ad_2__Hook_3_1.mp4 (the coach in a kurta on a red Navratri set, speaking Hindi with English
trading terms) into a finished vertical ad. User's words: "Put proper caption in English, put
B-rolls … background music … use black gradient while the caption is coming, you can use
typography in the caption, use After Effects animation and use proper video B-rolls of garba."

## Assets

- assets/ad2-hook3.mp4 — source clip (1080x1920, 60 fps, 52.37 s), voice on the clip.
- assets/whisper-segments.json — Whisper large-v3 Hindi transcript + English translation.
- captions/script.json — the English caption script, phrase windows from speech-band pauses,
  English words anchored to their spoken times.

## Customizations

- English captions translated from Hindi, typographic keyword emphasis, black gradient behind.
- After Effects-style animated cutaways in a Navratri look (garbo, dancers, rangoli, lights).
- Garba video B-roll: the user asked for real garba footage "from YouTube"; that is blocked here
  and copyrighted, so the cutaways are animated for now. Real clips the user attaches (their own,
  or the free Pexels clips found through vidIQ) replace or overlay the g1 scenes.
- Music: the user wants a YouTube Audio Library track; only they can download it. Until they
  attach one, an original garba-style track composed for this ad plays
  (tools/music/compose_garba.py, GeneralUser GS soundfont).

## Notes

- Render at 30 fps. Captions in y 1150–1480; cutaway content in y 120–1120; the CTA overlay keeps
  the face band (y≈450–830) clear.
- The loss beat reuses the 3D chart-crash scene from Avatar Video 1.
