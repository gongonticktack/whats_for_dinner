// レシピボード — /api/recipes から取得し、失敗時は Supabase REST へ直接フォールバック

const CATEGORY_ORDER = ["主菜", "副菜", "ごはん・麺", "汁物・スープ", "デザート"];

// カラーパレット（Color Hunt の人気パレットから選定、現行・他サイト使用分は除外）
// colors: パレット本来の4色（ストライプ表示用、比重 41/26/18/15）
// vars:   役割（メイン/サブ/ライト/アクセント）と、パレットから導出した
//         背景・面・文字色。暗いパレットは暗背景＋明文字、明るいパレットは
//         明背景＋暗文字になるよう各パレットごとに定義する。
//         端末のダーク/ライトモードでは切り替えず、常にパレットどおり
//         表示する（2026-11-23 Gomi指示）。
const PALETTES = [
  {
    name: "Dusty Rose",
    colors: ["#FFB4A2", "#E5989B", "#B5838D", "#6D6875"],
    vars: {
      main: "#6D6875", sub: "#8F5A66", light: "#FFB4A2", accent: "#E5989B",
      accentText: "#9E4453",
      bg: "#FBF2EE", surface: "#FFFFFF", surfaceMuted: "#F7E4DD",
      text: "#38303E", muted: "#71617A", border: "#ECD6CF",
      onMain: "#FFFFFF", headerSub: "#F7EDF3", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Coffee Beans",
    colors: ["#DDB892", "#B08968", "#7F5539", "#9C6644"],
    vars: {
      main: "#7F5539", sub: "#935F3C", light: "#DDB892", accent: "#B08968",
      accentText: "#8A5427",
      bg: "#FAF4EA", surface: "#FFFFFF", surfaceMuted: "#F3E7D3",
      text: "#3A2A1A", muted: "#7A6248", border: "#E7D6BC",
      onMain: "#FFFFFF", headerSub: "#EBD9C3", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Sage Garden",
    colors: ["#DDE5B6", "#ADC178", "#A98467", "#6C5849"],
    vars: {
      main: "#6C5849", sub: "#687636", light: "#DDE5B6", accent: "#ADC178",
      accentText: "#5F6E2C",
      bg: "#F7F8EC", surface: "#FFFFFF", surfaceMuted: "#EDF0DA",
      text: "#3B3A2A", muted: "#646B4A", border: "#DEE3C2",
      onMain: "#FFFFFF", headerSub: "#E4DCCF", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Terracotta Cream",
    colors: ["#F4F1DE", "#E07A5F", "#3D405B", "#81B29A"],
    vars: {
      main: "#3D405B", sub: "#B44E33", light: "#F4F1DE", accent: "#E07A5F",
      accentText: "#B54A30",
      bg: "#FAF8EE", surface: "#FFFFFF", surfaceMuted: "#F1EDD8",
      text: "#33354A", muted: "#60627A", border: "#E6E0C6",
      onMain: "#FFFFFF", headerSub: "#D5D8E4", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Natural Beige",
    colors: ["#FFE8D6", "#DDBEA9", "#CB997E", "#6B705C"],
    vars: {
      main: "#6B705C", sub: "#8A5A3B", light: "#FFE8D6", accent: "#CB997E",
      accentText: "#8A5427",
      bg: "#FBF5EC", surface: "#FFFFFF", surfaceMuted: "#F4E8D8",
      text: "#3C3A30", muted: "#6B6857", border: "#E9DCC6",
      onMain: "#FFFFFF", headerSub: "#F7F8EE", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Caramel Cream",
    colors: ["#FEFAE0", "#FAEDCD", "#D4A373", "#CCD5AE"],
    vars: {
      main: "#8A5A2B", sub: "#6B7A40", light: "#FAEDCD", accent: "#D4A373",
      accentText: "#96622A",
      bg: "#FDFBF2", surface: "#FFFFFF", surfaceMuted: "#F7EFDA",
      text: "#42351F", muted: "#756440", border: "#EDE3C4",
      onMain: "#FFFFFF", headerSub: "#FAF0DC", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Spice Market",
    colors: ["#EAE2B7", "#FCBF49", "#F77F00", "#D62828"],
    vars: {
      main: "#D62828", sub: "#A55800", light: "#EAE2B7", accent: "#FCBF49",
      accentText: "#C22525",
      bg: "#FBF7E8", surface: "#FFFFFF", surfaceMuted: "#F6EED3",
      text: "#402A1E", muted: "#77603F", border: "#EAE0BC",
      onMain: "#FFFFFF", headerSub: "#FFF0F0", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Citrus Grove",
    colors: ["#FF7B54", "#FFB26B", "#FFD56B", "#939B62"],
    vars: {
      main: "#C2512F", sub: "#63733A", light: "#FFD56B", accent: "#FFB26B",
      accentText: "#B44A28",
      bg: "#FDF6E9", surface: "#FFFFFF", surfaceMuted: "#F9ECD2",
      text: "#40342A", muted: "#72603F", border: "#F0DFC0",
      onMain: "#FFFFFF", headerSub: "#FFFFFF", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Matcha Leaf",
    colors: ["#DAD7CD", "#A3B18A", "#588157", "#3A5A40"],
    vars: {
      main: "#3A5A40", sub: "#4C724E", light: "#DAD7CD", accent: "#A3B18A",
      accentText: "#3F6B45",
      bg: "#F5F6EF", surface: "#FFFFFF", surfaceMuted: "#E9EBDD",
      text: "#2E3B2E", muted: "#5C6952", border: "#DDE0CC",
      onMain: "#FFFFFF", headerSub: "#D8E2D2", onSub: "#FFFFFF",
    },
    
  },
  {
    name: "Midnight Diner",
    colors: ["#1D3557", "#457B9D", "#A8DADC", "#E63946"],
    vars: {
      main: "#1D3557", sub: "#A8DADC", light: "#457B9D", accent: "#E63946",
      accentText: "#F28B82",
      bg: "#101E33", surface: "#1B2A44", surfaceMuted: "#24344F",
      text: "#EDF2F7", muted: "#A9BCD4", border: "#33465F",
      onMain: "#FFFFFF", headerSub: "#C9D8EA", onSub: "#10233B",
    },
  },
];

const PALETTE_VAR_KEYS = {
  main: "--main",
  sub: "--sub",
  light: "--light",
  accent: "--accent",
  accentText: "--accent-text",
  bg: "--bg",
  surface: "--surface",
  surfaceMuted: "--surface-muted",
  text: "--text",
  muted: "--muted",
  border: "--border",
  onMain: "--on-main",
  headerSub: "--header-sub",
  onSub: "--on-sub",
};


function applyPalette(palette) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(PALETTE_VAR_KEYS)) {
    root.style.setProperty(cssVar, palette.vars[key]);
  }
  // ストライプはパレット本来の4色をそのまま使う
  const stripe = document.querySelectorAll(".palette-stripe > span");
  stripe.forEach((span, i) => {
    if (palette.colors[i]) span.style.background = palette.colors[i];
  });
}

// 4色ストライプのサンプル（比重 41/26/18/15）を作る
function createSwatch(colors) {
  const swatch = document.createElement("span");
  swatch.className = "palette-swatch";
  swatch.setAttribute("aria-hidden", "true");
  colors.forEach((color) => {
    const seg = document.createElement("span");
    seg.style.background = color;
    swatch.appendChild(seg);
  });
  return swatch;
}

// パレットを適用し、トグル表示と一覧の選択中マークを同期する
// 選択は sessionStorage に保存し、その訪問中（アプリ内移動）は引き継ぐ
function setPalette(index) {
  try { sessionStorage.setItem('appPaletteIndex', String(index)); } catch (e) {}
  const palette = PALETTES[index];
  applyPalette(palette);
  const swatch = document.getElementById("palette-current-swatch");
  [...swatch.children].forEach((seg, i) => {
    if (palette.colors[i]) seg.style.background = palette.colors[i];
  });
  document.getElementById("palette-current-name").textContent = palette.name;
  document.querySelectorAll(".palette-item").forEach((item, i) => {
    item.setAttribute("aria-selected", String(i === index));
  });
}

function initPalette() {
  const menu = document.getElementById("palette-menu");
  const toggle = document.getElementById("palette-toggle");
  const list = document.getElementById("palette-list");

  function openList() {
    list.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }
  function closeList() {
    list.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  // 一覧の項目を全パレット分作る（名前＋選択中マークの下に、項目幅いっぱいの4色バー）
  PALETTES.forEach((p, i) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "palette-item";
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    const head = document.createElement("span");
    head.className = "palette-item-head";
    const name = document.createElement("span");
    name.className = "palette-item-name";
    name.textContent = p.name;
    head.appendChild(name);
    const check = document.createElement("span");
    check.className = "palette-check";
    check.setAttribute("aria-hidden", "true");
    check.textContent = "✓";
    head.appendChild(check);
    item.appendChild(head);
    // 色サンプルはヘッダーのストライプと同じバー形式（比重 41/26/18/15）
    const bar = createSwatch(p.colors);
    bar.classList.add("palette-bar");
    item.appendChild(bar);
    // 選んだら即時反映して閉じる（その訪問中だけ有効）
    item.addEventListener("click", () => {
      setPalette(i);
      closeList();
    });
    list.appendChild(item);
  });

  toggle.addEventListener("click", () => {
    if (list.hidden) openList();
    else closeList();
  });
  // 外側クリックで閉じる
  document.addEventListener("click", (e) => {
    if (!list.hidden && !menu.contains(e.target)) closeList();
  });
  // Escで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !list.hidden) {
      closeList();
      toggle.focus();
    }
  });

  // ランダムに選び直すのはTOP画面のリロードと新規アクセスのときだけ。
  // アプリ内移動では sessionStorage の選択を引き継ぐ（このサイトは単一ページ＝常にTOP画面扱い）
  const navEntry = performance.getEntriesByType('navigation')[0];
  const navType = navEntry ? navEntry.type : 'navigate';
  const fromSameApp = !!document.referrer && document.referrer.startsWith(location.origin);
  let savedPalette = null;
  try { savedPalette = sessionStorage.getItem('appPaletteIndex'); } catch (e) {}
  if (navType === 'reload' || !fromSameApp) savedPalette = null;
  const savedIndex = savedPalette === null ? NaN : parseInt(savedPalette, 10);
  if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < PALETTES.length) {
    setPalette(savedIndex);
  } else {
    setPalette(Math.floor(Math.random() * PALETTES.length));
  }
}

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

initPalette();
init();
