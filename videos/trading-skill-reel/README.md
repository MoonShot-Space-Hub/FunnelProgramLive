# Trading Skill Reel (ABCT With AI Masterclass promo)

An animated vertical reel (1080×1920, 30 fps, about 38 s) built with [Remotion](https://www.remotion.dev).
The final render is in `final/trading-skill-reel.mp4`.

## What's in it

| Element | How it's made | License / copyright |
| --- | --- | --- |
| Avatar presenter | Original SVG character (`src/components/Avatar.tsx`), lip-synced to the voice, with blinks, head motion and gestures | Original, made for this video |
| Voiceover | [Kokoro TTS](https://github.com/hexgrad/kokoro) open-weights model, voice `am_michael` | Apache-2.0, royalty-free |
| Captions | Word-by-word kinetic captions over a black gradient (`src/components/Captions.tsx`) | Original |
| B-roll | 11 animated motion-graphics scenes (`src/scenes/*`) | Original, made for this video |
| Background music | Synthesized from scratch (`tools/make_audio.py`) | Original, no third-party samples |
| Sound effects | Synthesized from scratch (`tools/make_audio.py`) | Original |
| Fonts | Anton, Montserrat, Caveat (Google Fonts) | SIL Open Font License |

## Script → scenes

| Time | Line | Scene |
| --- | --- | --- |
| 0–2.3 s | You wouldn't watch one surgery video | Avatar + "Surgery for Beginners" video card, "1" finger |
| 2.3–4.6 s | …and start operating on somebody. | Operating room, ECG monitor, shaky scalpel, UNQUALIFIED stamp |
| 4.6–6.1 s | You wouldn't read one article | 3D browser card, "5 minutes?!" annotation |
| 6.1–8.2 s | …and try to fly a plane. | Wobbling plane, smoke, PULL UP! warning |
| 8.2–10.6 s | But people watch three YouTube videos… | Three clickbait thumbnails pop in, counted 1-2-3 |
| 10.6–13.3 s | …and start operating their trading account. | Trading app, BUY clicks, crash to −61% |
| 13.4 s | Why? | Glitch "WHY?" slam, avatar shrug |
| 14.4–18.3 s | Trading is also a skill. And every real skill requires: | "SKILL" title, three empty slots |
| 18.3–21.8 s | Education. Practice. Rules. | Three pillars slam up, "TRADING SKILL" roof drops |
| 21.8–24.3 s | You don't need to learn everything overnight. | Night → sunrise, spinning clock, Day 1 → 90 progress |
| 24.3–28.5 s | But you do need to stop treating a professional skill like a shortcut. | STOP sign, SHORTCUT sign crossed out and falling |
| 28.5–38 s | CTA | Masterclass card builds, "LINK BELOW" button |

## Swap in a YouTube Audio Library track

The sandbox that built this couldn't reach YouTube, so the music is an original synthesized bed.
To use a YouTube Audio Library track instead:

1. In [YouTube Studio](https://studio.youtube.com), open **Audio Library** from the left menu and pick a track whose license reads **"You're free to use this song in any of your videos"** (no attribution needed). A mood like *Inspirational* or *Bright* at about 90–110 BPM fits.
2. Save it as `public/music.mp3`.
3. In `src/Reel.tsx` change `staticFile("music.wav")` to `staticFile("music.mp3")`.
4. Re-render (below).

## Re-render

```console
npm i
npx remotion studio          # preview and tweak
npx remotion render Reel out/trading-skill-reel.mp4 --crf=18
```

`remotion.config.ts` points Remotion at the Playwright Chromium in the cloud sandbox. Delete that
`setBrowserExecutable` line when rendering on your own machine.

## Change the voice or the script

Voice and timings come from `tools/make_voice.py` (Python 3, `pip install kokoro-onnx soundfile scipy`,
model files from the [kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)):

```console
python tools/make_voice.py --models <dir with kokoro-v1.0.onnx + voices-v1.0.bin> --voice am_michael
python tools/make_audio.py   # rebuilds the music so its sections follow the new timing
```

Female voice options include `af_heart` and `af_bella`. Edit `PHRASES` in `make_voice.py` to change the
words, the pause after each line, or which words are emphasised (`*word*`). Captions, lip-sync and scene
timing follow `src/data/timeline.json` automatically.

## Licensing note

Remotion is free for individuals and companies with up to 3 employees. Larger companies need a
[Remotion company license](https://www.remotion.pro/license) to render with it.
