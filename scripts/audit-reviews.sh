#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REVIEWS_DIR="$ROOT_DIR/data/reviews"

node - "$REVIEWS_DIR" <<'EOF'
const fs = require("fs");
const path = require("path");

const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.error("No review files found.");
  process.exit(2);
}

let missingSource = 0;
let needsVerification = 0;
let invalidDate = 0;
const invalidItems = [];

for (const file of files) {
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));

  if (!data.source_url && !data.source_note) {
    missingSource += 1;
    invalidItems.push(`${file}: missing source_url/source_note`);
  }

  if (data.needs_verification) {
    needsVerification += 1;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.verified_at || ""))) {
    invalidDate += 1;
    invalidItems.push(`${file}: invalid verified_at format`);
  }
}

const total = files.length;
const verificationRate = ((total - needsVerification) / total * 100).toFixed(2);

console.log(`Total reviews: ${total}`);
console.log(`Missing source entries: ${missingSource}`);
console.log(`Needs verification: ${needsVerification}`);
console.log(`Verified ratio: ${verificationRate}%`);
console.log(`Invalid verified_at: ${invalidDate}`);

if (invalidItems.length > 0) {
  console.log("Issues:");
  for (const issue of invalidItems) console.log(`- ${issue}`);
}

if (missingSource > 0 || invalidDate > 0) {
  process.exit(3);
}
EOF
