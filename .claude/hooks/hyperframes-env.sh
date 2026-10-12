#!/bin/bash
# Points the HyperFrames CLI at a local chrome-headless-shell so renders don't need to download a browser.
# Cloud sessions ship Playwright's headless shell under /opt/pw-browsers; elsewhere the CLI's own lookup applies.
set -euo pipefail
[ -n "${CLAUDE_ENV_FILE:-}" ] || exit 0
[ -n "${HYPERFRAMES_BROWSER_PATH:-}" ] && exit 0
shell=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | sort -V | tail -1 || true)
if [ -n "$shell" ] && [ -x "$shell" ]; then
  echo "export HYPERFRAMES_BROWSER_PATH=\"$shell\"" >> "$CLAUDE_ENV_FILE"
fi
exit 0
