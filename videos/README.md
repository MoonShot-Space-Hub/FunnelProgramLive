# Videos (HyperFrames)

Video editing in this repo uses [HyperFrames](https://github.com/heygen-com/hyperframes):
compositions are HTML + CSS + GSAP, rendered to MP4 with headless Chrome + FFmpeg.

## With Claude Code

HyperFrames skills are installed in `.claude/skills/`. Start any request with `/hyperframes`, e.g.

- "Using /hyperframes, add captions to `videos/raw/talk.mp4`" (`/embedded-captions`)
- "Using /hyperframes, add lower-thirds and callouts to this interview" (`/talking-head-recut`)
- "Using /hyperframes, make a 30s promo for the 10x coaching page" (`/general-video`)

Need another workflow later (e.g. `product-launch-video`, `music-to-video`)?
`npx hyperframes skills update <name>`.

## Manual CLI

```bash
npx hyperframes init videos/my-video --non-interactive   # new project
npx hyperframes init videos/my-edit -v path/to/clip.mp4  # start from footage (+ transcription)
cd videos/my-video
npm run dev      # browser preview with live reload
npm run check    # lint + validate
npm run render   # -> renders/*.mp4
```

Requirements: Node 22+, FFmpeg. `npx hyperframes doctor` checks everything.

## Notes for Claude Code cloud sessions

- A SessionStart hook (`.claude/hooks/hyperframes-setup.sh`) downloads the Chrome Headless Shell.
- `cdn.jsdelivr.net` is blocked by the cloud egress policy, so load libraries from local files
  (see `videos/starter/assets/vendor/gsap.min.js`) instead of CDN `<script>` tags.
- Whisper (transcription for captions) isn't installed in the cloud image; bring an existing
  transcript or install whisper.cpp locally.
- `videos/*/renders/` is gitignored.

## Transcription in cloud sessions

Hugging Face is blocked, but GitHub release downloads work, so sherpa-onnx models can be used:
`pip install sherpa-onnx soundfile` and download e.g.
`https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-large-v3.tar.bz2`
(multilingual; `task="translate"` gives English) or `sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2`
(English, word timestamps). Feed Whisper chunks under 30s.

## Projects

- `ad-4-edit/` — Ad 4 (ABCT with AI): English captions translated from the Hinglish voiceover,
  motion-graphic B-roll cutaways, original synthesized music bed. Edit `build.py`, run
  `python3 build.py`, then `npm run render`.
- `ad-2-edit/` — ABCT with AI new ad 2 (free GFS masterclass): same treatment as ad 4, with the
  caption gradient and the logo for the spoken "ABCT with AI".
- `cashtag-vbm-ad-2/` — Cashtag VBM ad 2 (#Cashtags 2.0 book + free 3-hour Intensive workshop):
  same treatment in the book's navy/orange palette, with title and Hindi + English overlays.
