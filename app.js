// レシピボード — /api/recipes から取得し、失敗時は Supabase REST へ直接フォールバック

const CATEGORY_ORDER = ["主菜", "副菜", "ごはん・麺", "汁物・スープ", "デザート"];

let allRecipes = [];
let pickedId = null;

async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    if (!res.ok) throw new Error("api " + res.status);
    return await res.json();
  } catch (e) {
    // フォールバック: config.json の Supabase REST を直接読む
    const cfgRes = await fetch("config.json");
    const cfg = await cfgRes.json();
    const url =
      cfg.supabase.url +
      "/rest/v1/recipes?select=*&order=category.asc,id.asc";
    const res = await fetch(url, {
      headers: {
        apikey: cfg.supabase.key,
        authorization: "Bearer " + cfg.supabase.key,
        accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("supabase " + res.status);
    return await res.json();
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function buildCard(recipe) {
  const card = el("article", "card");
  card.dataset.id = recipe.id;
  if (recipe.id === pickedId) card.classList.add("card-picked");

  const head = el("div", "card-head");
  head.appendChild(el("h3", "card-name", recipe.title));
  if (recipe.is_favorite) head.appendChild(el("span", "fav-star", "★"));
  card.appendChild(head);

  const meta = el("div", "card-meta");
  if (recipe.category) meta.appendChild(el("span", null, recipe.category));
  if (recipe.cooking_time_minutes != null)
    meta.appendChild(el("span", null, recipe.cooking_time_minutes + "分"));
  if (recipe.servings) meta.appendChild(el("span", null, recipe.servings));
  meta.appendChild(
    el("span", null, "作った回数: " + (recipe.cook_count || 0) + "回")
  );
  card.appendChild(meta);

  if (recipe.memo) card.appendChild(el("p", "card-notes", recipe.memo));

  // 材料と手順（クリックで展開）
  const detail = el("div", "card-detail");
  detail.hidden = true;

  if (recipe.ingredients) {
    detail.appendChild(el("h4", "detail-title", "材料"));
    const ing = el("ul", "detail-list");
    for (const line of recipe.ingredients.split("\n")) {
      if (line.trim()) ing.appendChild(el("li", null, line));
    }
    detail.appendChild(ing);
  }
  if (recipe.steps) {
    detail.appendChild(el("h4", "detail-title", "手順"));
    const steps = el("ol", "detail-list");
    for (const line of recipe.steps.split("\n")) {
      if (line.trim()) steps.appendChild(el("li", null, line));
    }
    detail.appendChild(steps);
  }
  if (recipe.source_url) {
    const a = el("a", "card-link", recipe.source_url);
    a.href = recipe.source_url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    detail.appendChild(a);
  }
  card.appendChild(detail);

  card.addEventListener("click", () => {
    detail.hidden = !detail.hidden;
    card.classList.toggle("card-open", !detail.hidden);
  });
  return card;
}

function currentFilters() {
  return {
    q: document.getElementById("search").value.trim().toLowerCase(),
    category: document.getElementById("filter-category").value,
  };
}

function matches(recipe, f) {
  if (f.category && recipe.category !== f.category) return false;
  if (f.q) {
    const hay = [recipe.title, recipe.category, recipe.ingredients, recipe.memo]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function render() {
  const f = currentFilters();
  const shown = allRecipes.filter((r) => matches(r, f));

  document.getElementById("count-shown").textContent = shown.length;

  const groups = document.getElementById("groups");
  groups.innerHTML = "";

  const byCategory = new Map();
  for (const r of shown) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, []);
    byCategory.get(r.category).push(r);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  for (const category of orderedCategories) {
    const recipes = byCategory.get(category);
    const section = el("section");
    const title = el("h2", "category-title", category || "その他");
    title.appendChild(el("span", "cat-count", recipes.length + "件"));
    section.appendChild(title);
    const grid = el("div", "cards");
    for (const r of recipes) grid.appendChild(buildCard(r));
    section.appendChild(grid);
    groups.appendChild(section);
  }

  const msg = document.getElementById("status-msg");
  if (shown.length === 0) {
    msg.textContent = "該当するレシピがありません。";
    msg.hidden = false;
  } else {
    msg.hidden = true;
  }
}

function pickRandom() {
  const uncookedOnly = document.getElementById("opt-uncooked-only").checked;
  const pool = uncookedOnly
    ? allRecipes.filter((r) => (r.cook_count || 0) === 0)
    : allRecipes;
  const result = document.getElementById("pick-result");

  if (pool.length === 0) {
    pickedId = null;
    result.textContent = uncookedOnly
      ? "未作成のレシピはありません。"
      : "レシピがありません。";
    result.hidden = false;
    render();
    return;
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  pickedId = picked.id;

  // 絞り込みで隠れないよう、フィルタをリセットしてから表示する
  document.getElementById("search").value = "";
  document.getElementById("filter-category").value = "";
  render();

  result.textContent = "今日の一品： " + picked.title;
  result.hidden = false;

  const card = document.querySelector(
    '.card[data-id="' + picked.id + '"]'
  );
  if (card) {
    // 材料・手順も開いて見せる
    const detail = card.querySelector(".card-detail");
    if (detail) {
      detail.hidden = false;
      card.classList.add("card-open");
    }
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function initSummary() {
  document.getElementById("count-total").textContent = allRecipes.length;
  document.getElementById("count-favorites").textContent = allRecipes.filter(
    (r) => r.is_favorite
  ).length;
  document.getElementById("count-uncooked").textContent = allRecipes.filter(
    (r) => (r.cook_count || 0) === 0
  ).length;
}

async function init() {
  const msg = document.getElementById("status-msg");
  try {
    allRecipes = await fetchRecipes();
  } catch (e) {
    msg.textContent = "データの取得に失敗しました。";
    msg.hidden = false;
    return;
  }
  initSummary();
  render();

  document.getElementById("search").addEventListener("input", render);
  document.getElementById("filter-category").addEventListener("change", render);
  document.getElementById("btn-random").addEventListener("click", pickRandom);
}

init();
