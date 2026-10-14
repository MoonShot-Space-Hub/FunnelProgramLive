# Videos (HyperFrames)

Video projects for this repo, built with [HyperFrames](https://github.com/heygen-com/hyperframes).
HyperFrames describes a video as an HTML page: clips, text, overlays and audio carry timing
attributes, GSAP animates them, and the CLI renders the result to MP4 in headless Chrome
with FFmpeg. Claude has the HyperFrames skills installed in this repo (`.claude/skills/`),
so the usual way to work is to ask Claude.

## Editing a video with Claude

1. Give Claude the footage. Attach it in the chat, or commit it into the project folder.
   GitHub rejects files over 100 MB.
2. Ask for the edit, starting with `/hyperframes`:

| You want                                                | Example request                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Captions or subtitles                                   | `Using /hyperframes, add clear animated captions to webinar-clip.mp4. Keep the footage unchanged.`             |
| Lower-thirds, titles, quotes, or stat cards on footage   | `Using /hyperframes, add a lower-third with my name and three key-point callouts to coaching-call.mp4.`        |
| Trim, cut, reorder, or join clips                       | `Using /hyperframes, cut the pauses out of intro.mp4 and join it with outro.mp4 into a 60-second reel.`        |
| A short motion graphic (under ~10 s)                    | `Using /hyperframes, make a 6-second "Enrolment closes Friday" stat hit in the 10X Coaching purple and amber.` |
| A vertical cut for Reels or Shorts                      | `Using /hyperframes, make a 1080x1920 version of promo.mp4 with captions.`                                     |

Claude plans the edit, builds it in `videos/<project-name>/`, runs the checks, renders an
MP4 and sends it to you. Each project is a plain folder you can edit and re-render.

## Working by hand

Requirements: Node.js 22+ and FFmpeg. The CLI downloads its own Chrome on first render.

```bash
cd videos
npx hyperframes init my-video --non-interactive               # new blank project
npx hyperframes init my-edit --non-interactive --video in.mp4  # new project around existing footage

cd my-video
npm run dev      # live preview / Studio editor in the browser
npm run check    # lint + runtime, layout, motion and contrast checks
npm run render   # render to renders/<name>_<timestamp>.mp4
```

`starter/` is a 5-second branded title card (Archivo, purple #8C2FC2, amber #FEB022) that
passes `npm run check` and renders. Copy it to start a new project.

Rendered files (`renders/`) and CLI working state (`.hyperframes/`) are gitignored.

## Cloud sessions (Claude Code on the web)

A SessionStart hook (`.claude/hooks/session-start.sh`) downloads Chrome Headless Shell at
the start of each cloud session, so renders work right away. It also checks the network.
This environment's network policy currently blocks:

- **`cdn.jsdelivr.net` and `unpkg.com`**, where compositions load GSAP and other libraries.
  `node videos/scripts/vendor-cdn-libs.mjs videos/<project>` swaps those URLs for local
  copies taken from the npm registry. Claude runs this automatically when the CDN is
  blocked.
- **`huggingface.co`**, where the speech-to-text models for captions come from. Until
  it is allowed, caption and transcript-driven edits need a transcript or `.srt` that you
  provide.

To remove both limits, add `cdn.jsdelivr.net`, `unpkg.com` and `huggingface.co` under
**Allowed domains** in the cloud environment's network settings (environment menu → Edit;
see the [network access docs](https://code.claude.com/docs/en/cloud-environments#network-access)).
Local machines are not affected.

## Skills and versions

- Installed in `.claude/skills/`: the HyperFrames core skills (`hyperframes`,
  `hyperframes-core`, `-animation`, `-audio`, `-cli`, `-creative`, `-keyframes`,
  `-registry`, `-studio`, `media-use`) and the editing workflows `embedded-captions`,
  `talking-head-recut`, `general-video` and `motion-graphics`. `skills-lock.json` records
  their sources.
- Other workflows (`music-to-video`, `product-launch-video`, `faceless-explainer`,
  `slideshow`, `pr-to-video`, ...) install on demand when a request needs them. To add one
  to the repo for good, or to refresh all of them, run from the repo root:

  ```bash
  npx skills add heygen-com/hyperframes --agent claude-code --copy --full-depth --yes --skill <name>
  ```

- Each project pins its CLI version in `package.json` (`hyperframes@0.8.156` today) so it
  re-renders identically. To upgrade a project, run
  `npx hyperframes@latest upgrade --project .` inside it.
- The HyperFrames CLI sends anonymous usage telemetry by default. To turn it off, run
  `npx hyperframes telemetry disable` or set `HYPERFRAMES_NO_TELEMETRY=1`.
