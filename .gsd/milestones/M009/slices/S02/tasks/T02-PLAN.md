---
estimated_steps: 14
estimated_files: 2
skills_used: []
---

# T02: Fix LSP12IssuedAsset handler bug, update entrypoint.sh, and verify build

Three changes:

1. **Fix LSP12IssuedAsset handler bug** — In `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`, the ID generation at lines ~179 and ~264 uses `const id = \`${address} - ${assetAddress}\`` without prefixId(). Fix both to use `const id = prefixId(hctx.batchCtx.network, \`${address} - ${assetAddress}\`)`. Import prefixId from `@/utils` if not already imported.

2. **Update docker/entrypoint.sh** — Add a step to run the hand-written backfill migration AFTER the auto-generated migrations but BEFORE starting the indexer. The backfill should run via `psql` using DATABASE_URL or via a custom script. Since squid-typeorm-migration only runs auto-generated TypeORM migrations, the hand-written SQL needs a separate execution path. Add:
```sh
echo "📊 Running backfill migration..."
if [ -f /app/packages/typeorm/db/migrations/backfill-network.sql ]; then
  psql "$DB_URL" -f /app/packages/typeorm/db/migrations/backfill-network.sql
  echo "✅ Backfill migration applied"
else
  echo "ℹ️  No backfill migration found - skipping"
fi
```
The DB_URL should be constructed from the existing DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS env vars that Subsquid uses, or use the DB_URL env var directly if available.

3. **Run build and tests** — Verify `pnpm --filter=@chillwhales/indexer build` and `pnpm --filter=@chillwhales/indexer test` both pass.

## Inputs

- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `packages/indexer/src/utils/index.ts`
- `docker/entrypoint.sh`
- `packages/typeorm/db/migrations/backfill-network.sql`

## Expected Output

- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `docker/entrypoint.sh`

## Verification

pnpm --filter=@chillwhales/indexer build exits 0. pnpm --filter=@chillwhales/indexer test exits 0. grep -q 'prefixId' packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts (confirms fix). grep -q 'backfill-network.sql' docker/entrypoint.sh (confirms entrypoint update).
