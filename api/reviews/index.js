/**
 * api/reviews/index.js
 * GET /api/reviews
 * Query params:
 *   ?category=urban   – filter by category
 *   ?q=nano           – full-text search on title_zh / title_en / summary_zh
 *
 * Falls back to the static reviews.json when DATABASE_URL is not configured.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { getClient } from "../../db/client.js";

const STATIC_PATH = join(process.cwd(), "src/pages/assets/reviews.json");

function staticFallback() {
  const raw = readFileSync(STATIC_PATH, "utf8");
  return JSON.parse(raw);
}

function applyQueryFilters(items, { category, q }) {
  let result = items;
  if (category) {
    result = result.filter((r) => r.category === category);
  }
  if (q) {
    const lq = q.toLowerCase();
    result = result.filter(
      (r) =>
        r.title_zh?.toLowerCase().includes(lq) ||
        r.title_en?.toLowerCase().includes(lq) ||
        r.summary_zh?.toLowerCase().includes(lq)
    );
  }
  return result;
}

export default async function handler(req, res) {
  // CORS – allow same-origin and CDN preview domains
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const { category, q } = req.query;

  try {
    const sql = await getClient();
    let rows;

    if (category && q) {
      const lq = `%${q}%`;
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
        ORDER BY created_at DESC
      `;
    } else if (category) {
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category}
        ORDER BY created_at DESC
      `;
    } else if (q) {
      const lq = `%${q}%`;
      rows = await sql`
        SELECT * FROM reviews
        WHERE title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
    }

    // Normalise DB rows to match static JSON shape (scores object)
    const data = rows.map(normaliseRow);
    return res.status(200).json(data);
  } catch (_dbErr) {
    // DB unavailable – serve static file
    const items = applyQueryFilters(staticFallback(), { category, q });
    return res.status(200).json(items);
  }
}

function normaliseRow(row) {
  return {
    slug: row.slug,
    title_zh: row.title_zh,
    title_en: row.title_en,
    summary_zh: row.summary_zh,
    summary_en: row.summary_en,
    brand: row.brand ?? null,
    category: row.category ?? null,
    age_range: row.age_range ?? null,
    weight_range: row.weight_range ?? null,
    source_url: row.source_url,
    source_note: row.source_note ?? null,
    needs_verification: row.needs_verification,
    verified_at: row.verified_at,
    scores: {
      safety: row.score_safety,
      handling: row.score_handling,
      portability: row.score_portability,
      value: row.score_value,
    },
  };
}
