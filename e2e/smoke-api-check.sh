#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --input-type=module <<'EOF'
import listHandler from "./api/reviews/index.js";
import slugHandler from "./api/reviews/[slug].js";

function createRes() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

const listReq = {
  method: "GET",
  query: {
    page: "1",
    limit: "3",
    category: "lightweight",
  },
};
const listRes = createRes();
await listHandler(listReq, listRes);

if (listRes.statusCode !== 200) {
  throw new Error(`GET /api/reviews failed with ${listRes.statusCode}`);
}
if (!Array.isArray(listRes.body)) {
  throw new Error("GET /api/reviews response is not array");
}
if (listRes.body.length > 3) {
  throw new Error("GET /api/reviews pagination limit not applied");
}
if (!("X-Total-Count" in listRes.headers)) {
  throw new Error("GET /api/reviews missing X-Total-Count header");
}

const firstSlug = listRes.body[0]?.slug;
if (!firstSlug) {
  throw new Error("GET /api/reviews returned empty list for smoke check");
}

const detailReq = {
  method: "GET",
  query: {
    slug: firstSlug,
  },
};
const detailRes = createRes();
await slugHandler(detailReq, detailRes);

if (detailRes.statusCode !== 200) {
  throw new Error(`GET /api/reviews/:slug failed with ${detailRes.statusCode}`);
}
if (!detailRes.body || detailRes.body.slug !== firstSlug) {
  throw new Error("GET /api/reviews/:slug returned unexpected payload");
}
if (!detailRes.body.scores || typeof detailRes.body.scores.safety !== "number") {
  throw new Error("GET /api/reviews/:slug missing scores payload");
}

console.log("API smoke check OK");
EOF
