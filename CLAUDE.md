# FunnelProgramLive

- `10x-coaching-2026 (2).html` — the coaching webapp (single self-contained HTML file).
- `video/` — HyperFrames project for making and editing videos (HTML compositions rendered to MP4).

## Video work (HyperFrames)

For any video request, start with the `/hyperframes` skill: it routes to the right workflow
(e.g. `/faceless-explainer` for a script with no footage, `/talking-head-recut` or
`/embedded-captions` for existing footage, `/product-launch-video` for a website). All 21
published HyperFrames skills are committed under `.claude/skills/`, and `video/CLAUDE.md` has
the project's command reference.

Run every CLI command from `video/`, pinned to the project's version:

```bash
cd video
npx hyperframes@0.8.152 lint      # fast structural check
npm run check                     # required gate: lint + runtime + layout + motion + contrast
npx hyperframes@0.8.152 render --quality draft --output renders/draft.mp4
```

### Cloud-session constraints

- **Load GSAP from `vendor/gsap/`, never a CDN.** The cloud environment's network policy blocks
  `cdn.jsdelivr.net`, `unpkg.com` and `cdnjs.cloudflare.com`, so a CDN `<script src>` (which the
  skills' examples use) fails in `check` and `render`. Use the vendored copy of GSAP 3.14.2 and its
  plugins instead, e.g. `<script src="vendor/gsap/gsap.min.js"></script>` or
  `vendor/gsap/SplitText.min.js`, loaded once in the host `index.html` (sub-compositions use
  the host's `gsap` global). Other libraries (Lottie, Three.js, Anime.js)
  must be vendored the same way: `npm pack <pkg>@<version>` works, since the npm registry is allowed.
- `.claude/hooks/session-start.sh` downloads the pinned Chrome Headless Shell at session start;
  if rendering complains about Chrome, run `npx hyperframes@0.8.152 browser ensure`.
- Rendered MP4s land in `video/renders/` (git-ignored). Send them to the user rather than committing them.
