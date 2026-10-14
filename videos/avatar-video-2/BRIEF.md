---
workflow: general-video
flow: automation
storyboard: no
message: "The money beliefs you heard growing up quietly shape your decisions. Question them, change the habits, start today with the free one-hour training."
destination: instagram-reels
aspect: 1080x1920
language: en
length: 43.32s
angle: footage-remix
---

## Intent

Edit Avatar_Video_1080p_1_1.mp4 (a coach in a magenta saree on a blue chair, warm bookshelf studio,
speaking English about money beliefs) into a finished vertical reel. User's words: "Put proper
caption in English, put B-rolls … background music from YouTube library … use black gradient
while the caption is coming, you can use typography in the caption, add After Effects animation
in this, I want only animation."

## Assets

- assets/avatar-video-2.mp4 — source clip (1080x1920, 25 fps, 43.32 s), voice on the clip. A-roll.
- assets/transcript.json — word-level transcript (Parakeet), drives captions and every cue.

## Customizations

- English captions synced word by word, typographic keyword emphasis, black gradient behind them.
- B-roll is animation only (the user's choice): After Effects-style motion-graphic cutaways designed
  for each key line; no stock footage.
- Music: the user asked for a YouTube Audio Library track; that cannot be downloaded here (YouTube is
  blocked and only the user can download from the library). An original warm, hopeful score is
  composed for this video (tools/music/compose.py, GeneralUser GS soundfont) and can be swapped for a
  library MP3 the user attaches.
- Sound design: bundled Pixabay-licensed SFX on transitions and hits.
- End CTA "Click the link below" over the speaker.

## Notes

- Render at 25 fps to match the source.
- Face centre ≈ (500, 660); face band y ≈ 540–780. Captions in y 1150–1480; cutaway content in
  y 120–1120; the CTA overlay keeps the face band clear.
- GSAP loads from vendor/gsap/ (CDNs are blocked here).
