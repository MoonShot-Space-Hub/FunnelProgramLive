---
workflow: general-video
flow: automation
storyboard: no
message: "Students who understand AI will leave the rest behind — join the free 3-hour AI masterclass"
destination: shorts-reels-ad
aspect: 1080x1920
language: en
length: 15s
angle: talking-head-recut
---

## Intent

Re-edit the existing 15-second talking-head ad `AD_2_1.mp4` in a Warikoo-style
Shorts energy (punch-in cuts, bold captions, sound design). User's words:
"Edit this. Put proper caption in English, put B-rolls — use the free version from
internet, non-copyright licences free — put background music from YouTube library,
non-copyright. Use black gradient while the caption is coming."

## Assets

- assets/footage/ad2-raw.mp4 — the user's raw ad (1080x1920, 60 fps, 15.05 s, English
  speech, 5 setups with hard cuts at 3.667 / 6.167 / 8.017 / 12.55 s). A-roll for the whole piece.

## Customizations

- English captions, word-synced, with a black gradient that appears while captions are on screen.
- B-roll cutaways from license-free stock (Mixkit / Pixabay / Pexels — free commercial use,
  no attribution required). Pending: user is opening network access to those domains.
- Background music: user asked for YouTube Audio Library. That library only downloads from the
  user's own signed-in YouTube Studio, so either the user uploads a track or we use a
  royalty-free Mixkit/Pixabay track (pending network access).
- SFX: bundled HyperFrames library (Pixabay Content License, no attribution required).

## Notes

- Inferred, not asked: flow automation + no storyboard (the request was a complete,
  imperative spec); destination = Shorts/Reels ad; caption style = Warikoo-like bold white
  with a yellow keyword highlight.
- Transcript (Whisper small, cross-checked with Vosk word timings): "In the next few years,
  there will be two types of students. One who understands AI and the one who doesn't. And
  the gap will be massive. We're hosting a free three-hour masterclass where they will learn
  AI practically. Click on the link below and register now."
- Raw footage stays out of git (see .gitignore).
