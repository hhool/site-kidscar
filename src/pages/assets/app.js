async function loadReviews(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.age) params.set("age", filters.age);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  // Prefer dynamic API when available (Vercel/Neon), fallback to static JSON.
  try {
    const query = params.toString();
    const url = query ? `/api/reviews?${query}` : "/api/reviews";
    const apiResponse = await fetch(url);
    if (apiResponse.ok) {
      return apiResponse.json();
    }
  } catch (_err) {
    // Ignore and continue with static fallback.
  }

  const staticResponse = await fetch("assets/reviews.json");
  if (!staticResponse.ok) {
    throw new Error("Failed to load review data");
  }
  return staticResponse.json();
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
  let requestSeq = 0;

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
    const query = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
    const ageFilter = document.getElementById("filter-age")?.value || "";
    const catFilter = document.getElementById("filter-category")?.value || "";

    let source = items;
    try {
      source = await loadReviews({
        q: query,
        category: catFilter,
        age: ageFilter,
        page: 1,
        limit: 50,
      });
    } catch (_err) {
      // Keep the in-memory static items when API and static fetch both fail here.
    }

    if (reqId !== requestSeq) return;

    const filtered = source.filter((item) => {
      const matchText = !query ||
        item.title_zh.toLowerCase().includes(query) ||
        item.summary_zh.toLowerCase().includes(query) ||
        (item.title_en && item.title_en.toLowerCase().includes(query));
      const matchAge = !ageFilter || item.age_range === ageFilter;
      const matchCat = !catFilter || item.category === catFilter;
      return matchText && matchAge && matchCat;
    });
    buildCards(filtered);
  }

  buildCards(items);

  const searchInput = document.getElementById("search-input");
  const filterAge = document.getElementById("filter-age");
  const filterCat = document.getElementById("filter-category");
  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (filterAge) filterAge.addEventListener("change", applyFilters);
  if (filterCat) filterCat.addEventListener("change", applyFilters);
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

function renderDetail(items) {
  const detailRoot = document.getElementById("detail-root");
  if (!detailRoot) return;
  const slug = queryParam("slug") || "sample-compact-stroller-2026";
  const item = bySlug(items, slug);
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
    const options = items.map((it) =>
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
    const reviews = await loadReviews();
    renderIndex(reviews);
    renderDetail(reviews);
    renderCompare(reviews);
  } catch (err) {
    const errorNode = document.getElementById("app-error");
    if (errorNode) {
      errorNode.textContent = `数据加载失败: ${err.message}`;
    }
  }
}

boot();
