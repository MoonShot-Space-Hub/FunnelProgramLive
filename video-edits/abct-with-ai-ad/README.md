# ABCT With AI — ad edit (Warikoo-style Short)

`ABCT_With_AI_edited.mp4` — 1080×1920, 59.94 fps, 35.7 s, −14 LUFS. Your original take and audio, re-edited.

## Style applied

The reference Short couldn't be downloaded (YouTube is blocked in the build environment).
So this edit follows Ankur Warikoo's general Shorts style, not a frame-by-frame breakdown of that one video:

| Element | What was done |
|---|---|
| **Cuts / pacing** | One continuous take turned into 21 "virtual camera" shots of about 1.7 s each. Framing alternates between wide, medium and close, and every shot is centred on your tracked face. Cuts land on phrase boundaries. |
| **Motion** | A slow 3.5% push-in during each shot. Each cut has a quick zoom overshoot ("punch"). Big moments (hook, FREE, 100% FREE, CLICK THE LINK, final CTA) add a white flash and a short camera shake. |
| **Captions** | English, 2–5 words at a time, at chest height. Bold white text with a heavy outline. Keywords are yellow and slightly larger, and each chunk scales in with a pop. |
| **Motion graphics** | Kept in the top third, above your head. Count-ups for "19 years" and "2.5 lakh+". FREE and 100% FREE stamps. "Overnight crorepati?" gets a red strike-through. Market → System → Systematic Trading chips, a "4-Day ABCT With AI" card with "3 days ABCT + 1 AI tool", and a bouncing arrow on both CTAs. |
| **Sound** | Cleaned voice (high-pass + compression) over an upbeat 104 BPM music bed that ducks under your voice. Whooshes on big framing changes, pops when graphics appear, ticks on the counters, impacts on stamps, risers into each CTA and a ding on "click the link". Music and SFX are synthesized originals, so there are no licensing issues. |
| **Grade** | A little more contrast and saturation, plus a soft vignette. |

## Captions (please review)

The audio is Hindi. The English captions are my translation, timed phrase by phrase, and are in `captions.ass`.
Two spots to check:
- **"ABCT"**: taken from your file name; the speech recognition heard "ABC TV".
- **28.4–30 s**: rendered as "3 days of ABCT + 1 AI tool".

## Re-building

`tools/` contains the full pipeline:
- `face.py` — face tracking
- `build.py` — cut plan, captions/graphics and SFX cues
- `render.py` — the virtual camera
- `synth.py` — music and SFX

To change caption wording or timing, edit `CAPS` in `build.py`, then re-run it and the final ffmpeg composite.
