/**
 * api/reviews/index.js
 * GET /api/reviews
 * Query params:
 *   ?category=urban   – filter by category
 *   ?q=nano           – full-text search on title_zh / title_en / summary_zh
 *   ?sort=latest|safety_desc|value_desc
 *   ?sort_dir=asc|desc
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

function parseSort(value) {
  const allowed = new Set(["latest", "safety_desc", "value_desc"]);
  const v = String(value || "latest");
  return allowed.has(v) ? v : "latest";
}

function parseSortDir(value) {
  const v = String(value || "desc").toLowerCase();
  return v === "asc" ? "asc" : "desc";
}

function applySort(items, sort, sortDir) {
  const list = [...items];
  const dir = sortDir === "asc" ? 1 : -1;
  if (sort === "safety_desc") {
    list.sort((a, b) => ((a.scores?.safety || 0) - (b.scores?.safety || 0)) * dir);
    return list;
  }
  if (sort === "value_desc") {
    list.sort((a, b) => ((a.scores?.value || 0) - (b.scores?.value || 0)) * dir);
    return list;
  }
  list.sort((a, b) => String(a.verified_at || "").localeCompare(String(b.verified_at || "")) * dir);
  return list;
}

export default async function handler(req, res) {
  // CORS – allow same-origin and CDN preview domains
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const category = asSingleValue(req.query.category) || "";
  const age = asSingleValue(req.query.age) || "";
  const q = asSingleValue(req.query.q) || "";
  const sort = parseSort(asSingleValue(req.query.sort));
  const sortDir = parseSortDir(asSingleValue(req.query.sort_dir));
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
      `;
    } else {
      const totalRows = await sql`SELECT COUNT(*)::int AS count FROM reviews`;
      total = totalRows[0]?.count ?? 0;
      rows = await sql`
        SELECT * FROM reviews
        ORDER BY created_at DESC
      `;
    }

    // Normalise DB rows to match static JSON shape (scores object)
    const data = applySort(rows.map(normaliseRow), sort, sortDir);
    const paged = data.slice(offset, offset + limit);
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Limit", String(limit));
    res.setHeader("X-Data-Source", "api-db");
    return res.status(200).json(paged);
  } catch (_dbErr) {
    // DB unavailable – serve static file
    const items = applySort(applyQueryFilters(staticFallback(), { category, age, q }), sort, sortDir);
    const total = items.length;
    const paged = items.slice(offset, offset + limit);
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("X-Page", String(page));
    res.setHeader("X-Limit", String(limit));
    res.setHeader("X-Data-Source", "api-static");
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
