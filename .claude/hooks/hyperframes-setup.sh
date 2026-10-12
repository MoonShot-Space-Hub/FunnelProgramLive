#!/usr/bin/env bash
# Prepare HyperFrames rendering in Claude Code cloud sessions.
# Chrome Headless Shell lives in ~/.cache, which doesn't survive a fresh container.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
npx --yes hyperframes@0.8.149 browser ensure >/dev/null 2>&1 || echo "hyperframes: browser ensure failed; run 'npx hyperframes browser ensure' manually" >&2
