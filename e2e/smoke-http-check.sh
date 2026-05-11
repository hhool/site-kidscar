#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-18080}"
BASE_URL="http://127.0.0.1:${PORT}"

cd "$ROOT_DIR/src/pages"
python3 -m http.server "$PORT" >/tmp/site-kidscar-smoke.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

sleep 1

curl -fsS "$BASE_URL/index.html" | grep -q "全球童车评测平台"
curl -fsS "$BASE_URL/review-detail.html?slug=urban-lite-360-2026" | grep -q "detail-root"
curl -fsS "$BASE_URL/compare.html?a=urban-lite-360-2026&b=trail-pro-x-2026" | grep -q "compare-body"
curl -fsS "$BASE_URL/assets/reviews.json" | grep -q "urban-lite-360-2026"

echo "Smoke checks passed: $BASE_URL"
