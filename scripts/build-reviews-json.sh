#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/data/reviews"
OUT_FILE="$ROOT_DIR/src/pages/assets/reviews.json"

node - "$SRC_DIR" "$OUT_FILE" <<'EOF'
const fs = require("fs");
const path = require("path");
const srcDir = process.argv[2];
const outFile = process.argv[3];

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort();
const items = files.map((file) => {
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  return JSON.parse(raw);
});

fs.writeFileSync(outFile, JSON.stringify(items, null, 2) + "\n", "utf8");
console.log(`Wrote ${items.length} reviews to ${outFile}`);
EOF
