# Reel: "Trading is a skill" (ABCT With AI Masterclass CTA)

Faceless 9:16 reel (1080×1920, 30 fps, ~36 s) built from this script:

> You wouldn't watch one surgery video and start operating on somebody.
> You wouldn't read one article and try to fly a plane.
> But people watch three YouTube videos… and start operating their trading account.
> Why? Trading is also a skill. And every real skill requires: Education. Practice. Rules.
> You don't need to learn everything overnight. But you do need to stop treating a professional skill like a shortcut.
>
> CTA: If you want a structured place to begin, watch my free one-hour ABCT With AI Masterclass. Link is below.

## Deliverables (`export/`)

| File | What |
| --- | --- |
| `trading-is-a-skill-reel.mp4` | Upload-ready reel: H.264 yuv420p + AAC, faststart, mixed to -14 LUFS |
| `captions.srt` | Same words as the burned-in captions, for YouTube / closed captions |

## What's in it (all copyright-free)

- **Voiceover**: Vishal Malkan's ElevenLabs voice (`voice/vishal-elevenlabs.mp3`). `tools/align.py` force-aligns the script to the recording with PocketSphinx, so captions, cuts and music hits land on the spoken words. `tools/tts.py` (Kokoro TTS) is still there as a fallback voice.
- **Captions**: burned-in, word-by-word, with the active word in yellow and key words in green. Kept inside the Reels/Shorts safe zone.
- **B-roll**: original motion graphics drawn in code: an ECG "surgery course", a "how to fly a plane" article, 3 YouTube-style videos, a crashing trading account, "WHY?", a skill unlock, the Education / Practice / Rules pillars, a staircase for "overnight", a SHORTCUT sign getting banned, and the masterclass end card with a "Link is below" button.
- **Music + SFX**: an original score synthesized in `tools/music.py`: a tense intro with a ticking clock, a riser into a hard cut and an impact on "Why?", then an Am–F–C–G groove that lifts for the CTA. There are whooshes on the cuts and chimes on Education / Practice / Rules, and the music ducks under the voice.
- **Logo**: the end card uses the "Anybody Can Trade With AI" (ABCT With AI) logo from `public/brand/abct-with-ai-logo.png`. It pops in on "ABCT" and glows on "AI".
- **Font**: Montserrat (SIL OFL, `public/fonts/OFL.txt`).

## Rebuild

```bash
npm i
# voice: align a recorded/ElevenLabs voiceover to the script (pip install pocketsphinx)
python tools/align.py voice/vishal-elevenlabs.mp3 .
# ...or synthesize one with Kokoro instead (needs kokoro-onnx + model files)
# python tools/patch_model.py kokoro-v1.0.onnx kokoro-timed.onnx
# python tools/tts.py kokoro-timed.onnx voices-v1.0.bin .
# music + mix (needs numpy, scipy, soundfile)
tools/build_audio.sh python3
# preview / render
npm run dev
npx remotion render TradingIsASkill out/trading-is-a-skill-reel.mp4 --codec=h264 --crf=18
python3 tools/srt.py
```

## Swapping in stock footage or a YouTube Audio Library track

- **Music**: download a track from YouTube Studio → Audio Library (pick one marked "No attribution required"). Mix it under `public/vo_master.wav` instead of `public/music.wav` in `tools/build_audio.sh`. Keep it about 12 dB under the voice.
- **Stock B-roll** (Pexels / Pixabay / Mixkit): drop clips into `public/broll/` and add an `<OffthreadVideo>` / `<Video>` layer behind (or instead of) the graphic in the matching `src/scenes/*.tsx`. Scene timings live in `src/timeline.ts`.
