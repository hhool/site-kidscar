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

function applyQueryFilters(items, { category, age, q }) {
  let result = items;
  if (category) {
    result = result.filter((r) => r.category === category);
  }
  if (age) {
    result = result.filter((r) => r.age_range === age);
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

function asSingleValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value, fallback, max) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

export default async function handler(req, res) {
  // CORS – allow same-origin and CDN preview domains
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const category = asSingleValue(req.query.category) || "";
  const age = asSingleValue(req.query.age) || "";
  const q = asSingleValue(req.query.q) || "";
  const page = parsePositiveInt(asSingleValue(req.query.page), 1, 100000);
  const limit = parsePositiveInt(asSingleValue(req.query.limit), 20, 100);
  const offset = (page - 1) * limit;

  try {
    const sql = await getClient();
    let rows;
    let total = 0;

    if (category && age && q) {
      const lq = `%${q}%`;
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE category = ${category}
          AND age_range = ${age}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category}
          AND age_range = ${age}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category && age) {
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE category = ${category} AND age_range = ${age}
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category} AND age_range = ${age}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (age && q) {
      const lq = `%${q}%`;
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE age_range = ${age}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE age_range = ${age}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category && q) {
      const lq = `%${q}%`;
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE category = ${category}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category}
          AND (title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (age) {
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE age_range = ${age}
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE age_range = ${age}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category) {
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE category = ${category}
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE category = ${category}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (q) {
      const lq = `%${q}%`;
      const totalRows = await sql`
        SELECT COUNT(*)::int AS count FROM reviews
        WHERE title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq}
      `;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        WHERE title_zh ILIKE ${lq} OR title_en ILIKE ${lq} OR summary_zh ILIKE ${lq}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      const totalRows = await sql`SELECT COUNT(*)::int AS count FROM reviews`;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Normalise DB rows to match static JSON shape (scores object)
    const data = rows.map(normaliseRow);
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Limit", String(limit));
    return res.status(200).json(data);
  } catch (_dbErr) {
    // DB unavailable – serve static file
    const items = applyQueryFilters(staticFallback(), { category, age, q });
    const total = items.length;
    const paged = items.slice(offset, offset + limit);
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Limit", String(limit));
    return res.status(200).json(paged);
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
