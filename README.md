# レシピボード

レシピ一覧とランダムピック（今日の一品選び）のサイト。

公開URL: https://recipes.gongonticktack.workers.dev/

## データ

- データソースは Supabase のテーブル `public.recipes`
- 初期データの投入は `schema.sql` を Supabase の SQL Editor で実行する（テーブル作成・RLS・公開 select ポリシー・25件のシードを含む）
- サイトは Cloudflare Worker の `/api/recipes` 経由で Supabase REST から読み取り、失敗時はブラウザから直接 Supabase REST を読む
- 接続情報（URL と anon キー）は `config.json` にある。書き込みは公開していない（RLS で select のみ許可）

## ローカル開発

```sh
npm install
npm run dev
```

## デプロイ

```sh
npm run deploy
```

wrangler で Cloudflare Workers にデプロイされる（`wrangler.jsonc` の `name: recipes`）。
