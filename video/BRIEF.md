---
workflow: general-video
flow: automation
storyboard: no
message: "Picture your future self: the number in your account matters, but so does the voice in your head. Don't wait to change it."
destination: instagram-reels
aspect: 1080x1920
language: en
length: 51.76s
angle: footage-remix
---

## Intent

Edit the existing talking-head avatar video (coach, "Trader" backdrop) into a finished vertical reel.
User's words: "Put proper caption in English, put B-rolls … put background music … use black gradient
while the caption is coming, you can use typography in the caption." B-roll: "Please design your
B-rolls animated, it looks like After Effects animation, please create best animation."
Music: "use any music you can, but I want music in the background." Review: "Just build it."

## Assets

- assets/avatar-video-1.mp4 — the source talking-head clip (1080x1920, 25 fps, 51.76s, voice on the clip). A-roll for the whole piece.
- assets/transcript.json — word-level transcript (Parakeet), drives captions and every cue.

## Customizations

- English captions synced word by word, typographic (keyword emphasis), over a black gradient that sits behind the captions.
- Original After Effects-style motion-graphic B-roll cutaways at key lines (no stock footage: stock sites are blocked by the environment's network policy and the user chose designed animation).
- Background music: an original instrumental composed for this video (YouTube Audio Library cannot be fetched here; user said "use any music you can"). Rendered with the GeneralUser GS soundfont (license allows commercial music production).
- Sound design: bundled Pixabay-licensed SFX (whoosh, impact, pop, riser, glitch) on transitions and hits.
- End CTA "Join us / Click the link below".

## Notes

- Render at 25 fps to match the source footage.
- Captions stay inside y 1150–1480 (clear of the face and of the platform UI at the bottom); B-roll content stays in y 120–1120.
- cdn.jsdelivr.net is blocked in this environment: GSAP loads from vendor/gsap/ in index.html only.
