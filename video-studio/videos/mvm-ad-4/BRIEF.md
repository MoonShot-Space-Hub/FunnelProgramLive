---
workflow: general-video
flow: automation
storyboard: no
message: "Teens who learn AI now get a superpower — join the free AI Superpowers for Teens masterclass"
destination: shorts-reels-ad
aspect: 1080x1920
language: en
length: 36s
angle: talking-head-recut
---

## Intent

Re-edit the 36 s talking-head ad `MVM_Ad_4_1.mp4` with creator-Shorts energy. User's words: "Edit this. Put
proper caption in English, put B-rolls — use the free version from internet, non-copyright licences free — put
background music from YouTube library, non-copyright. Use black gradient while the caption is coming. Use B-rolls
and music."

## Assets

- assets/footage/mvm4-raw.mp4 — the user's raw ad (1080x1920, 60 fps, 36.37 s, one static take, English speech,
  -24.2 LUFS). Not committed.
- assets/footage/mvm4-voice-norm.mp4 — same video stream, audio loudness-normalised to -16 LUFS (two-pass
  loudnorm, linear). The A-roll in index.html. Not committed.

## Customizations

- English captions, word-synced, with a black gradient behind them for the whole run.
- B-roll: stock sites and YouTube are blocked by this environment's network policy (fresh sessions too), so the
  B-roll is four original animated inserts (sub-compositions). Swappable for user-supplied stock clips.
- Music: original track (tools/compose_music_arranged.py + assets/music/arrangement.json). YouTube Audio Library
  tracks can only be downloaded by the user from YouTube Studio; swap in an uploaded track if provided.
- SFX: bundled HyperFrames library (Pixabay Content License, no attribution required).

## Notes

- Transcript verified with Whisper-small (full + windowed passes) and Vosk word timings. "your team" in the raw
  ASR is "your teen"; the breath/stumble at ~25.5 s is not captioned.
- Inferred, not asked: automation + no storyboard (complete imperative request), Shorts/Reels destination,
  caption style matching the AD_2 edit.
