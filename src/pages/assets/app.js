async function loadReviews(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.age) params.set("age", filters.age);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.sortDir) params.set("sort_dir", filters.sortDir);
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 20);
  params.set("page", String(page));
  params.set("limit", String(limit));

  // Prefer dynamic API when available (Vercel/Neon), fallback to static JSON.
  try {
    const query = params.toString();
    const url = query ? `/api/reviews?${query}` : "/api/reviews";
    const apiResponse = await fetch(url);
    if (apiResponse.ok) {
      const items = await apiResponse.json();
      const total = Number(apiResponse.headers.get("X-Total-Count") || items.length);
      const currentPage = Number(apiResponse.headers.get("X-Page") || page);
      const currentLimit = Number(apiResponse.headers.get("X-Limit") || limit);
      const source = apiResponse.headers.get("X-Data-Source") || "api";
      return { items, total, page: currentPage, limit: currentLimit, source };
    }
  } catch (_err) {
    // Ignore and continue with static fallback.
  }

  const staticResponse = await fetch("assets/reviews.json");
  if (!staticResponse.ok) {
    throw new Error("Failed to load review data");
  }
  const allItems = await staticResponse.json();
  const filtered = allItems.filter((item) => {
    const matchQ = !filters.q ||
      item.title_zh.toLowerCase().includes(filters.q) ||
      item.summary_zh.toLowerCase().includes(filters.q) ||
      (item.title_en && item.title_en.toLowerCase().includes(filters.q));
    const matchCategory = !filters.category || item.category === filters.category;
    const matchAge = !filters.age || item.age_range === filters.age;
    return matchQ && matchCategory && matchAge;
  });
  const dir = filters.sortDir === "asc" ? 1 : -1;
  const sorted = [...filtered];
  if (filters.sort === "safety_desc") {
    sorted.sort((a, b) => ((a.scores?.safety || 0) - (b.scores?.safety || 0)) * dir);
  } else if (filters.sort === "value_desc") {
    sorted.sort((a, b) => ((a.scores?.value || 0) - (b.scores?.value || 0)) * dir);
  } else {
    sorted.sort((a, b) => String(a.verified_at || "").localeCompare(String(b.verified_at || "")) * dir);
  }
  const offset = (page - 1) * limit;
  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    page,
    limit,
    source: "static-local",
  };
}

async function loadReviewBySlug(slug) {
  try {
    const response = await fetch(`/api/reviews/${encodeURIComponent(slug)}`);
    if (response.ok) {
      return response.json();
    }
  } catch (_err) {
    // Ignore and fallback to static data.
  }

  const fallback = await loadReviews({ page: 1, limit: 200 });
  return bySlug(fallback.items, slug);
}

function queryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function bySlug(items, slug) {
  return items.find((it) => it.slug === slug);
}

function renderIndex(items) {
  const list = document.getElementById("review-list");
  if (!list) return;
  const pagerInfo = document.getElementById("pager-info");
  const pagerPrev = document.getElementById("pager-prev");
  const pagerNext = document.getElementById("pager-next");
  const dataSource = document.getElementById("data-source");
  let requestSeq = 0;
  const state = {
    q: "",
    age: "",
    category: "",
    sort: "latest",
    sortDir: "desc",
    page: 1,
    limit: 6,
  };

  function hydrateStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.q = (params.get("q") || "").toLowerCase().trim();
    state.age = params.get("age") || "";
    state.category = params.get("category") || "";
    state.sort = params.get("sort") || "latest";
    state.sortDir = params.get("sort_dir") || "desc";
    const page = Number.parseInt(params.get("page") || "1", 10);
    state.page = Number.isFinite(page) && page > 0 ? page : 1;
  }

  function syncStateToUrl() {
    const params = new URLSearchParams(window.location.search);
    if (state.q) params.set("q", state.q); else params.delete("q");
    if (state.age) params.set("age", state.age); else params.delete("age");
    if (state.category) params.set("category", state.category); else params.delete("category");
    if (state.sort && state.sort !== "latest") params.set("sort", state.sort); else params.delete("sort");
    if (state.sortDir && state.sortDir !== "desc") params.set("sort_dir", state.sortDir); else params.delete("sort_dir");
    if (state.page > 1) params.set("page", String(state.page)); else params.delete("page");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }

  function updateSourceLabel(source) {
    if (!dataSource) return;
    if (source === "api-db") {
      dataSource.textContent = "数据来源：API（Neon DB）";
      return;
    }
    if (source === "api-static") {
      dataSource.textContent = "数据来源：API（静态回退）";
      return;
    }
    dataSource.textContent = "数据来源：本地静态文件";
  }

  function updatePager(total, page, limit) {
    const pages = Math.max(1, Math.ceil(total / limit));
    if (pagerInfo) pagerInfo.textContent = `第 ${page} / ${pages} 页 · 共 ${total} 条`;
    if (pagerPrev) pagerPrev.disabled = page <= 1;
    if (pagerNext) pagerNext.disabled = page >= pages;
  }

  function buildCards(filtered) {
    const noResults = document.getElementById("no-results");
    if (filtered.length === 0) {
      list.innerHTML = "";
      if (noResults) noResults.style.display = "block";
      return;
    }
    if (noResults) noResults.style.display = "none";

    function scoreBars(scores) {
      if (!scores) return "";
      const dims = [["安全", scores.safety], ["操控", scores.handling], ["便携", scores.portability], ["性价比", scores.value]];
      const rows = dims.map(([label, v]) =>
        `<div class="score-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${v * 10}%"></div></div>
          <span class="score-val">${v}</span>
        </div>`
      ).join("");
      return `<div class="score-bars">${rows}</div>`;
    }

    list.innerHTML = filtered
      .map((item) => {
        const detailHref = `review-detail.html?slug=${encodeURIComponent(item.slug)}`;
        const compareHref = `compare.html?a=${encodeURIComponent(item.slug)}&b=sample-compact-stroller-2026`;
        return `
          <article class="card">
            <h3>${item.title_zh}</h3>
            <p>${item.summary_zh}</p>
            <p class="meta">${item.age_range} | ${item.weight_range}</p>
            ${scoreBars(item.scores)}
            <div class="actions">
              <a class="btn" href="${detailHref}">查看详情</a>
              <a class="btn secondary" href="${compareHref}">加入对比</a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function applyFilters() {
    const reqId = ++requestSeq;
    state.q = (document.getElementById("search-input")?.value || state.q).toLowerCase().trim();
    state.age = document.getElementById("filter-age")?.value || state.age;
    state.category = document.getElementById("filter-category")?.value || state.category;
    state.sort = document.getElementById("sort-by")?.value || state.sort;
    state.sortDir = document.getElementById("sort-dir")?.value || state.sortDir;

    let payload = {
      items,
      total: items.length,
      page: state.page,
      limit: state.limit,
      source: "static-local",
    };
    try {
      payload = await loadReviews(state);
    } catch (_err) {
      // Keep the in-memory static items when API and static fetch both fail here.
    }

    if (reqId !== requestSeq) return;

    state.page = payload.page;
    buildCards(payload.items);
    updatePager(payload.total, payload.page, payload.limit);
    updateSourceLabel(payload.source);
    syncStateToUrl();
  }

  async function resetAndApply() {
    state.page = 1;
    await applyFilters();
  }

  async function goPage(delta) {
    state.page = Math.max(1, state.page + delta);
    await applyFilters();
  }

  const searchInput = document.getElementById("search-input");
  const filterAge = document.getElementById("filter-age");
  const filterCat = document.getElementById("filter-category");
  const sortBy = document.getElementById("sort-by");
  const sortDir = document.getElementById("sort-dir");

  hydrateStateFromUrl();
  if (searchInput) searchInput.value = state.q;
  if (filterAge) filterAge.value = state.age;
  if (filterCat) filterCat.value = state.category;
  if (sortBy) sortBy.value = state.sort;
  if (sortDir) sortDir.value = state.sortDir;

  applyFilters();

  if (searchInput) searchInput.addEventListener("input", resetAndApply);
  if (filterAge) filterAge.addEventListener("change", resetAndApply);
  if (filterCat) filterCat.addEventListener("change", resetAndApply);
  if (sortBy) sortBy.addEventListener("change", resetAndApply);
  if (sortDir) sortDir.addEventListener("change", resetAndApply);
  if (pagerPrev) pagerPrev.addEventListener("click", () => goPage(-1));
  if (pagerNext) pagerNext.addEventListener("click", () => goPage(1));
}

function injectJsonLd(item) {
  const el = document.getElementById("jsonld");
  if (!el) return;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": item.title_en || item.title_zh,
    "description": item.summary_en || item.summary_zh,
    "url": `https://www.site-kidscar.com/review/${item.slug}`,
    "audience": {
      "@type": "PeopleAudience",
      "suggestedMinAge": 0,
      "suggestedMaxAge": 4
    },
    "review": {
      "@type": "Review",
      "reviewBody": item.summary_zh,
      "datePublished": item.verified_at || "",
      "author": { "@type": "Organization", "name": "Site Kidscar" },
      "publisher": { "@type": "Organization", "name": "Site Kidscar",
        "url": "https://www.site-kidscar.com" }
    }
  };
  el.textContent = JSON.stringify(schema);

  // Also update <title> and og:title dynamically
  document.title = `${item.title_zh} | Site Kidscar`;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", `${item.title_zh} | Site Kidscar`);
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute("content", `${item.title_zh} | Site Kidscar`);
  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = `https://www.site-kidscar.com/review/${item.slug}`;
  document.head.appendChild(canonical);
}

async function renderDetail(items) {
  const detailRoot = document.getElementById("detail-root");
  if (!detailRoot) return;
  const slug = queryParam("slug") || "sample-compact-stroller-2026";
  let item = null;
  try {
    item = await loadReviewBySlug(slug);
  } catch (_err) {
    item = bySlug(items, slug);
  }

  if (!item) {
    item = bySlug(items, slug);
  }
  if (!item) {
    detailRoot.innerHTML = "<section class=\"card\"><h1>未找到评测数据</h1></section>";
    return;
  }

  injectJsonLd(item);

  const verifiedBadge = item.needs_verification
    ? '<span style="color:#b45309;font-size:13px;">⚠ 待校验</span>'
    : '<span style="color:#16a34a;font-size:13px;">✓ 已核实</span>';

  detailRoot.innerHTML = `
    <section class="card">
      <h1>${item.title_zh}</h1>
      <p class="meta">${item.age_range} | ${item.weight_range} &nbsp;${verifiedBadge}</p>
      <p>${item.summary_zh}</p>
      <p style="color:#5a667b;">${item.summary_en}</p>
    </section>
    <section class="card">
      <h2>基础参数</h2>
      <ul>
        <li>适用年龄: ${item.age_range}</li>
        <li>体重区间: ${item.weight_range}</li>
      </ul>
    </section>
    ${item.scores ? `
    <section class="card">
      <h2>评分</h2>
      <div class="score-bars">
        ${[["安全", item.scores.safety], ["操控", item.scores.handling], ["便携", item.scores.portability], ["性价比", item.scores.value]].map(([label, v]) => `
        <div class="score-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${v * 10}%"></div></div>
          <span class="score-val">${v}</span>
        </div>`).join("")}
      </div>
    </section>` : ""}
    <section class="card">
      <h2>来源信息</h2>
      <p><a href="${item.source_url}" target="_blank" rel="noopener noreferrer">查看原始来源</a></p>
      ${item.source_note ? `<p>${item.source_note}</p>` : ""}
      ${item.verified_at ? `<p>核实时间: ${item.verified_at}</p>` : ""}
    </section>
    <p style="margin-top:12px;"><a href="index.html">← 返回列表</a> &nbsp;
    <a href="compare.html?a=${encodeURIComponent(item.slug)}&b=sample-compact-stroller-2026">与其他车型对比</a></p>
  `;
}

function renderCompare(items) {
  const tableBody = document.getElementById("compare-body");
  const headA = document.getElementById("head-a");
  const headB = document.getElementById("head-b");
  const pickerA = document.getElementById("picker-a");
  const pickerB = document.getElementById("picker-b");
  if (!tableBody || !headA || !headB) return;

  // Populate pickers if present
  if (pickerA && pickerB) {
    const compareCandidates = [...items].sort(
      (a, b) => (b.scores?.safety || 0) - (a.scores?.safety || 0)
    );
    const options = compareCandidates.map((it) =>
      `<option value="${it.slug}">${it.title_zh}</option>`
    ).join("");
    pickerA.innerHTML = options;
    pickerB.innerHTML = options;

    // Set initial selection from URL params
    const initA = queryParam("a") || (items[0] && items[0].slug) || "";
    const initB = queryParam("b") || (items[1] && items[1].slug) || (items[0] && items[0].slug) || "";
    pickerA.value = initA;
    pickerB.value = initB;
  }

  function buildTable() {
    const aSlug = pickerA ? pickerA.value : (queryParam("a") || "sample-compact-stroller-2026");
    const bSlug = pickerB ? pickerB.value : (queryParam("b") || "urban-lite-360-2026");
    const a = bySlug(items, aSlug);
    const b = bySlug(items, bSlug);

    if (!a || !b) {
      tableBody.innerHTML = "<tr><td colspan=\"3\">未找到可对比数据</td></tr>";
      return;
    }

    if (headA) headA.textContent = a.title_zh;
    if (headB) headB.textContent = b.title_zh;

    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("a", aSlug);
    url.searchParams.set("b", bSlug);
    window.history.replaceState(null, "", url.toString());

    const rows = [
      ["适用年龄",   a.age_range,           b.age_range],
      ["体重区间",   a.weight_range,         b.weight_range],
      ["安全评分",   a.scores ? `${a.scores.safety}/10` : "—", b.scores ? `${b.scores.safety}/10` : "—"],
      ["操控评分",   a.scores ? `${a.scores.handling}/10` : "—", b.scores ? `${b.scores.handling}/10` : "—"],
      ["便携评分",   a.scores ? `${a.scores.portability}/10` : "—", b.scores ? `${b.scores.portability}/10` : "—"],
      ["性价比评分", a.scores ? `${a.scores.value}/10` : "—", b.scores ? `${b.scores.value}/10` : "—"],
      ["核实状态",   a.needs_verification ? "⚠ 待校验" : "✓ 已核实",
                    b.needs_verification ? "⚠ 待校验" : "✓ 已核实"],
      ["核实时间",   a.verified_at || "—",  b.verified_at || "—"],
      ["来源",       `<a href="${a.source_url}" target="_blank" rel="noopener">查看</a>`,
                    `<a href="${b.source_url}" target="_blank" rel="noopener">查看</a>`]
    ];

    tableBody.innerHTML = rows.map(([dim, va, vb]) => {
      const diff = va !== vb;
      const cls = diff ? " class=\"highlight\"" : "";
      return `<tr><td>${dim}</td><td${cls}>${va}</td><td${cls}>${vb}</td></tr>`;
    }).join("");
  }

  buildTable();
  if (pickerA) pickerA.addEventListener("change", buildTable);
  if (pickerB) pickerB.addEventListener("change", buildTable);
}

async function boot() {
  try {
    const data = await loadReviews({ page: 1, limit: 100 });
    renderIndex(data.items);
    await renderDetail(data.items);
    renderCompare(data.items);
  } catch (err) {
    const errorNode = document.getElementById("app-error");
    if (errorNode) {
      errorNode.textContent = `数据加载失败: ${err.message}`;
    }
  }
}

boot();
