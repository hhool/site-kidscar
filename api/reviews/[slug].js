/**
 * api/reviews/[slug].js
 * GET /api/reviews/:slug
 *
 * Returns a single review by its slug.
 * Falls back to the static reviews.json when DATABASE_URL is not configured.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { getClient } from "../../db/client.js";

const STATIC_PATH = join(process.cwd(), "src/pages/assets/reviews.json");

function staticFallback(slug) {
  const raw = readFileSync(STATIC_PATH, "utf8");
  const items = JSON.parse(raw);
  return items.find((r) => r.slug === slug) ?? null;
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const { slug } = req.query;

  if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: "Invalid slug" });
  }

  try {
    const sql = await getClient();
    const rows = await sql`SELECT * FROM reviews WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.status(200).json(normaliseRow(rows[0]));
  } catch (_dbErr) {
    const item = staticFallback(slug);
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(item);
  }
}
