/**
 * db/client.js
 * Returns a Neon serverless SQL tagged-template client.
 * Falls back gracefully when DATABASE_URL is not set (static/dev mode).
 */

let _sql = null;

async function getClient() {
  if (_sql) return _sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Falling back to static data.");
  }

  // Lazy-load so the module is tree-shaken in environments without the dep.
  const { neon } = await import("@neondatabase/serverless");
  _sql = neon(url);
  return _sql;
}

export { getClient };
