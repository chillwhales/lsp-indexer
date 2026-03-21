# S02: Docs, changeset & build verification

**Goal:** Document the batch encrypted asset API across all docs pages, create a changeset for minor release, and verify the full 5-package build including docs.
**Demo:** `pnpm build` exits 0 across types, node, react, next, and docs. Docs pages contain batch API documentation. Changeset file exists with correct format.

## Must-Haves

- Node docs page documents `fetchEncryptedAssetsBatch` with params table and usage example
- React docs page documents `useEncryptedAssetsBatch` with params table and usage example
- Next.js docs page documents `useEncryptedAssetsBatch` and `getEncryptedAssetsBatch` server action
- All three docs domain summary tables updated to include batch entries
- Changeset file lists all four packages (`@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next`) as `minor`
- `pnpm build` exits 0 across all 5 packages (types, node, react, next, docs)

## Verification

- `grep -q "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx`
- `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx`
- `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx`
- `ls .changeset/add-encrypted-assets-batch.md` (changeset file exists)
- `grep -q "@lsp-indexer/types" .changeset/add-encrypted-assets-batch.md`
- `pnpm build` exits 0

## Observability / Diagnostics

- **Docs build failure signals**: If MDX syntax is malformed, `pnpm build` in `apps/docs` will emit a parse error with the file path and line number. Grep for `SyntaxError` or `MDXError` in build output.
- **Verification surface**: `grep -q` checks against each docs page confirm the batch API entries exist. Slice verification includes a full `pnpm build` gate.
- **Failure visibility**: Missing batch entries are detectable by grepping for `fetchEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, `getEncryptedAssetsBatch`, and `EncryptedAssetBatchTuple` in the respective docs pages.

## Tasks

- [x] **T01: Add batch encrypted asset documentation to all three docs pages** `est:25m`
  - Why: R012 requires docs covering `fetchEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, batch tuple params, and usage examples. Without docs updates, the docs package may also fail to represent the new API.
  - Files: `apps/docs/src/app/docs/node/page.mdx`, `apps/docs/src/app/docs/react/page.mdx`, `apps/docs/src/app/docs/next/page.mdx`
  - Do: (1) In node docs, update the Encrypted Assets row in the fetch functions table (line 73) to add `fetchEncryptedAssetsBatch`. Add a "Batch Encrypted Asset Fetch" section after the existing encrypted assets content documenting `fetchEncryptedAssetsBatch(url, { tuples, include? })` with params table and usage code block. Mention `encryptedAssetKeys.batch()` in the Query Key Factories section. (2) In react docs, update the Encrypted Assets row in the Available Domains table (line 159) to add `useEncryptedAssetsBatch`. Add a "Batch Encrypted Asset Fetch" section following the "Batch Follow Checking" pattern (lines 166–193). (3) In next docs, update both the server actions table and hooks table in the Encrypted Assets row (line 171 area) to add `getEncryptedAssetsBatch` and `useEncryptedAssetsBatch`. Add a "Batch Encrypted Asset Fetch" section following the "Batch Follow Checking" pattern (lines 178–195). Follow the M003 batch docs structure exactly.
  - Verify: `grep -q "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx && grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx && grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx && grep -q "EncryptedAssetBatchTuple" apps/docs/src/app/docs/react/page.mdx`
  - Done when: All three docs pages contain batch encrypted asset documentation with params, usage examples, and updated domain tables.

- [ ] **T02: Create changeset and verify full 5-package build** `est:10m`
  - Why: R013 requires a changeset for minor release. R014 requires all 5 packages (including docs) to build with zero errors. This is the final verification gate for the milestone.
  - Files: `.changeset/add-encrypted-assets-batch.md`
  - Do: (1) Create `.changeset/add-encrypted-assets-batch.md` with YAML frontmatter listing all four packages as `minor` and a summary line + bullet list of changes (follow exact format from M003's `add-use-is-following-batch.md`). (2) Run `pnpm build` and verify all 5 packages exit 0. If docs build fails, diagnose MDX syntax issues in the pages edited by T01.
  - Verify: `test -f .changeset/add-encrypted-assets-batch.md && grep -q "@lsp-indexer/types" .changeset/add-encrypted-assets-batch.md && pnpm build`
  - Done when: Changeset file exists with correct format. `pnpm build` exits 0 across all 5 packages.

## Files Likely Touched

- `apps/docs/src/app/docs/node/page.mdx`
- `apps/docs/src/app/docs/react/page.mdx`
- `apps/docs/src/app/docs/next/page.mdx`
- `.changeset/add-encrypted-assets-batch.md`
