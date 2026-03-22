---
estimated_steps: 3
estimated_files: 1
---

# T02: Create changeset and verify full 5-package build

**Slice:** S02 — Docs, changeset & build verification
**Milestone:** M005

## Description

Create a changeset file for the minor release of all four consumer packages, then run the full monorepo build to verify all 5 packages (types, node, react, next, docs) compile with zero errors. This is the final verification gate for M005.

## Steps

1. **Create changeset file** at `.changeset/add-encrypted-assets-batch.md`. Use the exact format from M003's changeset (`git show 8e87755:.changeset/add-use-is-following-batch.md`):

   ```md
   ---
   '@lsp-indexer/types': minor
   '@lsp-indexer/node': minor
   '@lsp-indexer/react': minor
   '@lsp-indexer/next': minor
   ---

   Add batch encrypted asset fetch for multiple `(address, contentId, revision)` tuples in a single query

   - Add `EncryptedAssetBatchTupleSchema`, `UseEncryptedAssetsBatchParamsSchema` Zod schemas and inferred types
   - Add `fetchEncryptedAssetsBatch` service with `_or`/`_and` Hasura query and 3-overload include narrowing
   - Add `encryptedAssetKeys.batch()` cache key factory entry
   - Add `createUseEncryptedAssetsBatch` factory and `useEncryptedAssetsBatch` hook in `@lsp-indexer/react`
   - Add `getEncryptedAssetsBatch` server action and `useEncryptedAssetsBatch` hook in `@lsp-indexer/next`
   - Add batch encrypted asset documentation to node, react, and next docs pages
   ```

2. **Run full monorepo build:** `pnpm build` — verify all 5 packages exit 0. The build order is: types → node → react → next → docs. If docs fails, it's likely an MDX syntax issue from T01 — diagnose and fix.

3. **Verify changeset format:** Confirm the changeset file has correct YAML frontmatter with all four packages as `minor`, and that the `docs` package is NOT listed (it's in the changeset `ignore` list per `.changeset/config.json`).

## Must-Haves

- [ ] Changeset file `.changeset/add-encrypted-assets-batch.md` exists
- [ ] Changeset YAML lists all four packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) as `minor`
- [ ] `pnpm build` exits 0 across all 5 packages

## Verification

- `test -f .changeset/add-encrypted-assets-batch.md`
- `grep -q "'@lsp-indexer/types': minor" .changeset/add-encrypted-assets-batch.md`
- `grep -q "'@lsp-indexer/node': minor" .changeset/add-encrypted-assets-batch.md`
- `grep -q "'@lsp-indexer/react': minor" .changeset/add-encrypted-assets-batch.md`
- `grep -q "'@lsp-indexer/next': minor" .changeset/add-encrypted-assets-batch.md`
- `pnpm build` exits 0

## Inputs

- T01 completed — all three docs pages updated with batch encrypted asset content
- `.changeset/config.json` — confirms `fixed` group includes all four packages, `ignore` includes `docs`
- M003 changeset format: `git show 8e87755:.changeset/add-use-is-following-batch.md`
- S01 summary — list of all new symbols added across all packages

## Expected Output

- `.changeset/add-encrypted-assets-batch.md` — changeset file with correct format ready for `changeset version`
- Full monorepo build passing (verified by `pnpm build` exit 0)
