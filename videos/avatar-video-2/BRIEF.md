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

## Revision 2 (user feedback on the first render)

- "The background sound effect which you have added make it -15 dB": the music bed is set to
  -15 dB (data-volume 0.178) and every SFX cue is lowered by the same 5 dB.
- "All the animation cannot come on my face, and follow the Instagram guideline": every cutaway is
  now a transparent overlay that keeps the face zone (x 360–670, y 500–870) clear, and all text,
  cards and captions stay inside Meta's Reels safe zone (top 14%, bottom 35%, sides 6% kept clear:
  x 65–1015, y 270–1248). Captions moved to y 1030–1248; transitions are fades, not full-frame
  zooms or wipes.

## Revision 3

- "Background music is too loud, make it -20 dB more": the music bed drops another 20 dB, from
  -15 dB to -35 dB (data-volume 0.0178). The SFX are unchanged. A -20 dB alternative was delivered
  too, since "-20 dB more" can also be read as "make it -20 dB".
- The user asked for an editable timeline: tools/ae/build_avatar_video_2_timeline.jsx builds an
  After Effects comp with one layer per scene, per caption and per sound effect, the music on its
  own layer, and editable text captions (tools/ae/cut_timeline_clips.py cuts the clips).

## Notes

- Render at 25 fps to match the source.
- Face centre ≈ (500, 660); the face spans x ≈ 395–635, y ≈ 570–825 (OpenCV, every 0.2 s). See
  frame.md "Canvas and layout (v2)" for the overlay zones.
- GSAP loads from vendor/gsap/ (CDNs are blocked here).
