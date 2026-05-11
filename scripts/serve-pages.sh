#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/src/pages"

PORT="${1:-8080}"
python3 -m http.server "$PORT"
