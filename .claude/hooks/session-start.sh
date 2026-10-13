#!/bin/bash
# Prepares Claude Code cloud sessions to lint, check, preview and render the
# HyperFrames project in video/. Node 22 and FFmpeg come with the image; this
# warms the pinned hyperframes CLI in the npx cache and downloads the Chrome
# Headless Shell build it renders with.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/video"

# Use the same CLI version the project's npm scripts pin.
HF_VERSION=$(grep -o 'hyperframes@[0-9][0-9.]*' package.json | head -1 | cut -d@ -f2)

# Idempotent: finds the cached browser when it is already present.
npx --yes "hyperframes@${HF_VERSION}" browser ensure
