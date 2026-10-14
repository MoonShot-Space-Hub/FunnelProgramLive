#!/bin/bash
# Prepares HyperFrames video rendering in Claude Code cloud sessions.
# Node 22 and FFmpeg ship with the cloud image; this pre-downloads the pinned
# CLI and its Chrome Headless Shell so `npm run check` / `npm run render` work
# right away, and flags network-policy blocks that break renders.
# Stdout becomes session context for Claude, so progress goes to stderr.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Warm the same CLI version the starter project pins, so its Chrome matches.
HF_VERSION=$(node -e '
  const s = require("./videos/starter/package.json").scripts.render;
  const m = s.match(/hyperframes@([0-9][^ ]*)/);
  process.stdout.write(m ? m[1] : "latest");
' 2>/dev/null || echo latest)

if npx --yes "hyperframes@${HF_VERSION}" browser ensure >&2; then
  echo "HyperFrames ${HF_VERSION}: Chrome Headless Shell ready; FFmpeg at $(command -v ffmpeg || echo 'MISSING')."
else
  echo "HyperFrames ${HF_VERSION}: 'browser ensure' failed; local renders will retry the Chrome download."
fi

reachable() {
  curl -sS -o /dev/null --max-time 8 --range 0-0 "$1" 2>/dev/null
}

if ! reachable "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"; then
  echo "Network note: cdn.jsdelivr.net is blocked in this session. Compositions must load GSAP and other libraries from local files (see 'Cloud sessions' in CLAUDE.md), or renders fail with sub_timeline_script_failure."
fi
if ! reachable "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin"; then
  echo "Network note: huggingface.co is blocked in this session, so transcription (captions / talking-head workflows) cannot download speech models."
fi
