// レシピボード — Cloudflare Worker
// 静的アセット配信 + /api/recipes を Supabase REST へプロキシする

const SUPABASE_URL = "https://ngsfugndmboqquyksnwr.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nc2Z1Z25kbWJvcXF1eWtzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQyNTgsImV4cCI6MjA5NDMzMDI1OH0.Bj6mvl_QskSnBOS8-GEB6eI9iqZxtfT9M_FTO6nPM6w";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

async function handleRecipes() {
  const url =
    SUPABASE_URL +
    "/rest/v1/recipes?select=*&order=category.asc,id.asc";
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      authorization: "Bearer " + SUPABASE_KEY,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    return json(
      { error: "supabase_error", status: res.status },
      502
    );
  }
  const data = await res.json();
  return json(data, 200, {
    "cache-control": "public, s-maxage=300, stale-while-revalidate=60",
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/recipes" && request.method === "GET") {
        return handleRecipes();
      }
      return json({ error: "not_found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
