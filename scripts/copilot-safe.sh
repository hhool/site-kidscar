#!/usr/bin/env bash
set -euo pipefail

COPILOT_BIN="/usr/local/bin/copilot"

if [[ ! -x "$COPILOT_BIN" ]]; then
  echo "copilot binary not found at $COPILOT_BIN" >&2
  exit 1
fi

"$COPILOT_BIN" "$@"
