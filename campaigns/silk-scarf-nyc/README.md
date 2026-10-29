# Luxury Silk Scarf: New York (20 s, 9:16 commercial)

Production kit for the five-scene storyboard in `source/storyboard.jpg`,
featuring the camel-and-black leopard silk scarf in `source/scarf-product.jpg`.

**Status: pre-production complete, no footage generated yet.** The Higgsfield
connector available to Claude can only read the model catalogue, credits and
history. It can't run generations or upload files, so the shots have to be
generated in the Higgsfield app using `PROMPT_PACKAGE.md`.

| Path | What it is |
|---|---|
| `PROMPT_PACKAGE.md` | **Start here.** Model and settings choices, product and character bibles, 11 start-frame prompts (Nano Banana Pro), 10 shot prompts (Kling 3.0 / Seedance 2.0), edit timings, audio brief, QC checklist |
| `reference-frames/` | Clean per-shot crops of every storyboard photo panel (no borders, headings, notes or placeholder text), plus the product flat lay. See `_contact_sheet.jpg` |
| `edit/shots.csv` | Edit decision list: 10 shots, in-points, exact frame counts (480 frames = 20 s @ 24 fps), transitions, per-shot grade |
| `edit/assemble.py` | Conforms the clips to 1080×1920, applies the shared warm grade, overlays the end card, mixes music and NYC ambience at −14 LUFS, and exports the MP4 |
| `edit/make_endcard.py` → `edit/endcard.png` | Transparent tagline overlay ("TIMELESS LUXURY / IN EVERY DETAIL"), with an optional logo slot that stays clean when no logo is supplied |
| `tools/extract_reference_frames.py` | Re-creates `reference-frames/` from the storyboard |
| `edit/fonts/` | Cormorant Garamond (SIL Open Font License) |

## Workflow

1. Generate the 11 start frames (F01, F02, F04–F07, F09, F10, F11A, F11B, F12) in Higgsfield (Nano Banana Pro, 9:16, 2K) → `frames/`
2. Animate shots S1A–S5B (Kling 3.0 / Seedance 2.0, 9:16, 5 s, sound off) → `clips/S1A.mp4` …
3. Adjust `in_sec` in `edit/shots.csv` to the best moment of each take.
4. Add the licensed music and ambience → `audio/`
5. Render:

```bash
python3 edit/make_endcard.py            # add --logo brand/logo.png when a logo is supplied
python3 edit/assemble.py --check
python3 edit/assemble.py --music audio/music.wav --ambience audio/nyc_street.wav
```

→ `export/silk_scarf_nyc_20s_1080x1920.mp4`

`assemble.py` was tested with placeholder test-pattern clips (mixed 720×1280,
1280×720 and 1080×1920 sources). Both hard-cut and dissolve timelines produced
exactly 480 frames / 20.000 s at 1080×1920, 24 fps, with audio at −14.1 LUFS.
It needs `ffmpeg`/`ffprobe` 6+ and Python 3 with Pillow.
