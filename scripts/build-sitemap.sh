#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REVIEWS_DIR="$ROOT_DIR/data/reviews"
OUT="$ROOT_DIR/src/pages/sitemap.xml"
BASE_URL="${SITE_BASE_URL:-https://www.site-kidscar.com}"

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
  echo '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  echo ''
  echo '  <url>'
  echo "    <loc>$BASE_URL/</loc>"
  echo '    <changefreq>weekly</changefreq>'
  echo '    <priority>1.0</priority>'
  echo '  </url>'
  echo ''

  for f in "$REVIEWS_DIR"/*.json; do
    slug=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$f','utf8')).slug||'')")
    if [[ -n "$slug" ]]; then
      echo '  <url>'
      echo "    <loc>$BASE_URL/review/$slug</loc>"
      echo '    <changefreq>monthly</changefreq>'
      echo '    <priority>0.8</priority>'
      echo '  </url>'
      echo ''
    fi
  done

  echo '  <url>'
  echo "    <loc>$BASE_URL/compare</loc>"
  echo '    <changefreq>weekly</changefreq>'
  echo '    <priority>0.7</priority>'
  echo '  </url>'
  echo ''
  echo '</urlset>'
} > "$OUT"

echo "Generated sitemap: $OUT ($(grep -c '<loc>' "$OUT") URLs)"
