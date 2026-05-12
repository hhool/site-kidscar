#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/src/pages"

PORT="${1:-${PORT:-8080}}"

is_port_busy() {
	local p="$1"
	lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
}

pick_available_port() {
	local start="$1"
	local p="$start"
	local max_tries=30
	local i=0

	while (( i < max_tries )); do
		if ! is_port_busy "$p"; then
			echo "$p"
			return 0
		fi
		p=$((p + 1))
		i=$((i + 1))
	done

	return 1
}

if is_port_busy "$PORT"; then
	NEXT_PORT="$(pick_available_port "$PORT")" || {
		echo "No available port found starting from $PORT" >&2
		exit 1
	}
	echo "Port $PORT is in use, switching to $NEXT_PORT"
	PORT="$NEXT_PORT"
fi

echo "Serving at: http://127.0.0.1:$PORT/index.html"
python3 -m http.server "$PORT"
