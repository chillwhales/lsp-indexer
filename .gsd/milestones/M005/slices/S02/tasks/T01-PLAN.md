---
estimated_steps: 5
estimated_files: 3
---

# T01: Add batch encrypted asset documentation to all three docs pages

**Slice:** S02 — Docs, changeset & build verification
**Milestone:** M005

## Description

Add documentation for the batch encrypted asset API (`fetchEncryptedAssetsBatch`, `useEncryptedAssetsBatch`, `getEncryptedAssetsBatch`) to the node, react, and next docs pages. Update each page's domain summary table to include the batch entries, then add a dedicated "Batch Encrypted Asset Fetch" section with parameter tables and usage examples. Follow the M003 "Batch Follow Checking" docs pattern exactly.

**Relevant skills:** none needed — this is pure MDX documentation editing.

## Steps

1. **Node docs — update fetch functions table (line 73):** Change the Encrypted Assets row from `| Encrypted Assets | — | fetchEncryptedAssets |` to include `fetchEncryptedAssetsBatch` in the list column. Also add `fetchIsFollowingBatch`-equivalent: add "Additional: `fetchEncryptedAssetsBatch`" note below the table or inline it.

2. **Node docs — add batch section:** After the existing encrypted assets content (or after the "Mutual follow queries" content — find the appropriate location near other batch/additional functions), add a "Batch Encrypted Asset Fetch" section:
   - One-line description: `fetchEncryptedAssetsBatch` fetches multiple encrypted assets by `(address, contentId, revision)` tuples in a single Hasura query.
   - Parameters table: `tuples` (required, `EncryptedAssetBatchTuple[]` where each tuple has `{ address: string, contentId: string, revision: number }`), `include` (optional, `EncryptedAssetInclude`).
   - Usage code block showing import from `@lsp-indexer/node` and calling `fetchEncryptedAssetsBatch(url, { tuples, include })`.
   - Note: empty tuples short-circuits (no network call). Address uses case-insensitive matching.

3. **Node docs — query key factories (line 116 area):** Add `encryptedAssetKeys.batch(tuples, include)` to the key factory examples or mention it alongside existing key factory docs.

4. **React docs — update domain table (line 159):** Add `useEncryptedAssetsBatch` to the Encrypted Assets row in the Available Domains table. Then add a "Batch Encrypted Asset Fetch" section following the exact structure of the "Batch Follow Checking" section (lines 166–193):
   - Description: `useEncryptedAssetsBatch` fetches multiple encrypted assets by tuple in a single query.
   - Parameters table: `tuples` (`EncryptedAssetBatchTuple[]`, required), `include` (`EncryptedAssetInclude`, optional).
   - Usage code block: import from `@lsp-indexer/react`, show `useEncryptedAssetsBatch({ tuples, include })` returning `{ encryptedAssets, isLoading, error }`.
   - Note: hook disabled when `tuples` is empty. `EncryptedAssetInclude` narrows return type. Return has no `totalCount`.

5. **Next.js docs — update tables (line 171 area):** Add `getEncryptedAssetsBatch` to the server actions column and `useEncryptedAssetsBatch` to the hooks for the Encrypted Assets row. Then add a "Batch Encrypted Asset Fetch" section following the "Batch Follow Checking" pattern (lines 178–195):
   - Description: `useEncryptedAssetsBatch` fetches via the `getEncryptedAssetsBatch` server action.
   - Usage code block with import from `@lsp-indexer/next`.
   - Note: server action validates input via Zod. Hasura URL stays hidden from browser.

## Must-Haves

- [ ] Node docs fetch table includes `fetchEncryptedAssetsBatch`
- [ ] Node docs has "Batch Encrypted Asset Fetch" section with params table and usage example
- [ ] React docs Available Domains table includes `useEncryptedAssetsBatch`
- [ ] React docs has "Batch Encrypted Asset Fetch" section with params table and usage example
- [ ] Next.js docs tables include `getEncryptedAssetsBatch` and `useEncryptedAssetsBatch`
- [ ] Next.js docs has "Batch Encrypted Asset Fetch" section with usage example

## Verification

- `grep -q "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx`
- `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx`
- `grep -q "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx`
- `grep -q "EncryptedAssetBatchTuple" apps/docs/src/app/docs/react/page.mdx`
- `grep -q "getEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx`
- `grep -q "encryptedAssetKeys" apps/docs/src/app/docs/node/page.mdx`

## Inputs

- `apps/docs/src/app/docs/react/page.mdx` lines 166–193 — "Batch Follow Checking" section to use as structural template
- `apps/docs/src/app/docs/next/page.mdx` lines 178–195 — Next.js "Batch Follow Checking" section to use as structural template
- S01 summary — batch function signature: `fetchEncryptedAssetsBatch(url, { tuples, include? })` returning `{ encryptedAssets: P[] }` (no `totalCount`). React hook: `useEncryptedAssetsBatch({ tuples, include? })`. Next.js hook: same but routed through `getEncryptedAssetsBatch` server action.
- `EncryptedAssetBatchTuple` type: `{ address: string, contentId: string, revision: number }`
- `EncryptedAssetInclude` provides type narrowing on batch results (same include type as single fetch)

## Expected Output

- `apps/docs/src/app/docs/node/page.mdx` — updated with batch fetch function in table, batch section with params and usage, key factory mention
- `apps/docs/src/app/docs/react/page.mdx` — updated with batch hook in domain table, batch section with params and usage
- `apps/docs/src/app/docs/next/page.mdx` — updated with batch server action and hook in tables, batch section with usage
