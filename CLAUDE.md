# FunnelProgramLive

- `10x-coaching-2026 (2).html` — the 10X Coaching 2026 funnel web app (single file).
- `videos/` — video projects built with HyperFrames (HTML → MP4). See `videos/README.md`.

## Video work (HyperFrames)

- For any request to make, edit, caption, cut or render a video, load the `/hyperframes`
  skill first. It routes to the right workflow. The skills live in `.claude/skills/`.
- Create each project in its own folder, `videos/<kebab-case-name>/`:
  `npx hyperframes init videos/<name> --non-interactive [--video <file>]`. Keep the source
  footage inside that project folder.
- `videos/starter/` is a verified, lint-clean branded title card. Reuse its brand tokens:
  Archivo (local `@font-face`), purple `#8C2FC2`, indigo `#251F70`, amber `#FEB022`.
- Run `npm run check` in the project folder before every render. Renders land in
  `renders/`, which is gitignored. Send the rendered MP4 to the user rather than
  committing it.

### Cloud sessions

The SessionStart hook prints a `Network note:` line for each host the environment blocks.
When a note says so:

- **`cdn.jsdelivr.net` blocked**: after writing or editing a project's HTML and before
  `check` / `render`, run `node videos/scripts/vendor-cdn-libs.mjs videos/<name>`. It
  replaces jsDelivr/unpkg URLs with local copies under `vendor/`, fetched through the npm
  registry. Commit the `vendor/` files with the project. If a render still reports
  `sub_timeline_script_failure`, look for a CDN URL the script could not map.
- **`huggingface.co` blocked**: `hyperframes transcribe` cannot download speech models.
  Ask the user for a transcript or `.srt`, or for `huggingface.co` to be added to the
  environment's allowed domains. Do not invent transcript timings.
