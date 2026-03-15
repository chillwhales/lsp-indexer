# Phase 23 Deployment Notes — LSP29 v2.0.0 Encrypted Asset Spec

## Breaking Schema Changes

This phase introduces **destructive database schema changes** that require a clean re-index:

### Deleted
- `lsp29_encrypted_asset_encryption_params` table (entire entity removed)
- `lsp29_access_control_condition` table (v1.0 entity, removed in prior commit)

### Modified
- `lsp29_encrypted_asset_encryption` — 5 new nullable columns added:
  - `token_address` (varchar, indexed)
  - `required_balance` (varchar)
  - `required_token_id` (varchar)
  - `followed_addresses` (text array)
  - `unlock_timestamp` (varchar)
- Removed `params` FK relation to deleted `encryption_params` table

### New entities (from earlier commits in this phase)
- `lsp29_encrypted_asset_title`
- `lsp29_encrypted_asset_description`
- `lsp29_encrypted_asset_file`
- `lsp29_encrypted_asset_chunks`
- `lsp29_encrypted_asset_image`
- `lsp29_encrypted_asset_entry`
- `lsp29_encrypted_asset_revision_count`
- `lsp29_encrypted_assets_length`

## Deployment Steps

### 1. Generate migration
```bash
pnpm --filter=@chillwhales/typeorm build
npx squid-typeorm-migration generate
```
**Review the generated SQL** — verify the `DROP TABLE` for `encryption_params` and the `ALTER TABLE` for new columns on `encryption`.

### 2. Apply migration
```bash
npx squid-typeorm-migration apply
```

### 3. Regenerate Hasura metadata
After DB migration, Hasura metadata must be refreshed to reflect:
- Removed `lsp29_encrypted_asset_encryption_params` table/relationships
- New columns on `lsp29_encrypted_asset_encryption`
- Removed `lsp29_access_control_condition` table

```bash
# Re-track tables and relationships in Hasura
pnpm hasura:apply
```

### 4. Regenerate Hasura introspection schema
```bash
pnpm --filter=@lsp-indexer/node schema:dump
pnpm --filter=@lsp-indexer/node codegen
```
This cleans up stale types (e.g., `lsp29_access_control_condition`, `lsp29_encrypted_asset_encryption_params`) from the GraphQL codegen output.

### 5. Re-index from genesis
Since the encryption entity structure changed fundamentally (params moved from separate table to flattened columns), **a full re-index is required**. Historical encryption rows will have `NULL` for the 5 new params columns and cannot be backfilled without re-fetching metadata.

## Package Version Bumps
- `@chillwhales/indexer`: major (2.x → 3.0.0)
- `@lsp-indexer/types`: major (1.x → 2.0.0)
- `@lsp-indexer/node`: major (1.x → 2.0.0)
- `@lsp-indexer/react`: major (auto via `fixed` group)
- `@lsp-indexer/next`: major (auto via `fixed` group)

## Rollback
If rollback is needed, the migration must be reversed manually — `squid-typeorm-migration` does not support automatic rollback for `DROP TABLE`. Keep a backup of the `encryption_params` table before applying the migration.
