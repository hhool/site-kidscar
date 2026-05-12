#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <json-file>" >&2
  exit 1
fi

FILE="$1"

node -e '
const fs = require("fs");
const required = ["slug","title_zh","title_en","summary_zh","summary_en","source_url","verified_at"];
const file = process.argv[1];
const raw = fs.readFileSync(file, "utf8");
const data = JSON.parse(raw);
const missing = required.filter((k) => !(k in data) || data[k] === "");
if (missing.length) {
  console.error("Missing required fields:", missing.join(", "));
  process.exit(2);
}
// Optional scores validation: if present, all four sub-fields must be 0-10 integers
if ("scores" in data) {
  const dims = ["safety","handling","portability","value"];
  const scoreErrs = dims.filter((d) => {
    const v = data.scores[d];
    return typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 10;
  });
  if (scoreErrs.length) {
    console.error("Invalid score fields (must be integer 0-10):", scoreErrs.join(", "));
    process.exit(3);
  }
}
console.log("OK:", file);
' "$FILE"
