async function loadReviews() {
  const response = await fetch("assets/reviews.json");
  if (!response.ok) {
    throw new Error("Failed to load reviews.json");
  }
  return response.json();
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
  list.innerHTML = items
    .map((item) => {
      const detailHref = `review-detail.html?slug=${encodeURIComponent(item.slug)}`;
      const compareHref = `compare.html?a=${encodeURIComponent(item.slug)}&b=sample-compact-stroller-2026`;
      return `
        <article class="card">
          <h3>${item.title_zh}</h3>
          <p>${item.summary_zh}</p>
          <p class="meta">${item.age_range} | ${item.weight_range}</p>
          <div class="actions">
            <a class="btn" href="${detailHref}">查看详情</a>
            <a class="btn secondary" href="${compareHref}">加入对比</a>
          </div>
        </article>
      `;
    })
    .join("");
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
  detailRoot.innerHTML = `
    <section class="card">
      <h1>${item.title_zh}</h1>
      <p class="meta">Model: ${item.slug} | needs_verification: ${item.needs_verification}</p>
      <p>${item.summary_zh}</p>
      <p>${item.summary_en}</p>
    </section>
    <section class="card">
      <h2>基础参数</h2>
      <ul>
        <li>适用年龄: ${item.age_range}</li>
        <li>体重区间: ${item.weight_range}</li>
      </ul>
    </section>
    <section class="card">
      <h2>来源信息</h2>
      <p>source_url: ${item.source_url}</p>
      <p>source_note: ${item.source_note || ""}</p>
      <p>verified_at: ${item.verified_at}</p>
    </section>
  `;
}

function renderCompare(items) {
  const tableBody = document.getElementById("compare-body");
  const headA = document.getElementById("head-a");
  const headB = document.getElementById("head-b");
  if (!tableBody || !headA || !headB) return;

  const aSlug = queryParam("a") || "sample-compact-stroller-2026";
  const bSlug = queryParam("b") || "urban-lite-360-2026";
  const a = bySlug(items, aSlug);
  const b = bySlug(items, bSlug);

  if (!a || !b) {
    tableBody.innerHTML = "<tr><td colspan=\"3\">未找到可对比数据</td></tr>";
    return;
  }

  headA.textContent = a.title_zh;
  headB.textContent = b.title_zh;

  const rows = [
    ["适用年龄", a.age_range, b.age_range],
    ["体重区间", a.weight_range, b.weight_range],
    ["是否待校验", String(a.needs_verification), String(b.needs_verification)],
    ["来源链接", `<a href=\"${a.source_url}\" target=\"_blank\">A 来源</a>`, `<a href=\"${b.source_url}\" target=\"_blank\">B 来源</a>`]
  ];

  tableBody.innerHTML = rows
    .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
    .join("");
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
