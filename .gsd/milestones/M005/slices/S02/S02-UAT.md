# S02: Docs, changeset & build verification — UAT

**Milestone:** M005
**Written:** 2026-03-21

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S02 produces static documentation files and a changeset — all outputs are verifiable by file inspection and build compilation. No runtime behavior to test.

## Preconditions

- All S01 code (batch fetch function, hooks, types, server actions) is already merged/present in the working tree
- `pnpm install` has been run (node_modules present)
- No Hasura endpoint required — docs are static MDX

## Smoke Test

Run `pnpm build` from the monorepo root. All 5 packages (types, node, react, next, docs) must exit 0.

## Test Cases

### 1. Node docs contain batch encrypted asset documentation

1. Open `apps/docs/src/app/docs/node/page.mdx`
2. Find the fetch functions table (around line 73)
3. **Expected:** The Encrypted Assets row includes `fetchEncryptedAssetsBatch`
4. Search for "Batch Encrypted Asset Fetch" section heading
5. **Expected:** Section exists with a params table documenting `tuples` and `include` parameters
6. **Expected:** Usage code block shows `fetchEncryptedAssetsBatch(url, { tuples })` call pattern
7. Search for `encryptedAssetKeys.batch`
8. **Expected:** Key factory entry appears in the Query Key Factories section

### 2. React docs contain batch encrypted asset documentation

1. Open `apps/docs/src/app/docs/react/page.mdx`
2. Find the Available Domains table (around line 159)
3. **Expected:** The Encrypted Assets row includes `useEncryptedAssetsBatch`
4. Search for "Batch Encrypted Asset Fetch" section heading
5. **Expected:** Section exists with params table documenting `tuples` and `include` parameters
6. **Expected:** Usage code block shows `useEncryptedAssetsBatch({ tuples })` call pattern
7. **Expected:** Notes mention disabled-when-empty behavior and no `totalCount`

### 3. Next.js docs contain batch encrypted asset documentation

1. Open `apps/docs/src/app/docs/next/page.mdx`
2. Find the server actions table
3. **Expected:** Encrypted Assets row includes `getEncryptedAssetsBatch`
4. Search for "Batch Encrypted Asset Fetch" section heading
5. **Expected:** Section exists with usage showing both server action and hook patterns
6. **Expected:** Notes mention Zod validation and hidden Hasura URL

### 4. Changeset file exists with correct format

1. Open `.changeset/add-encrypted-assets-batch.md`
2. **Expected:** YAML frontmatter contains exactly four packages:
   - `'@lsp-indexer/types': minor`
   - `'@lsp-indexer/node': minor`
   - `'@lsp-indexer/react': minor`
   - `'@lsp-indexer/next': minor`
3. **Expected:** Body contains a summary line and bullet list of new symbols (EncryptedAssetBatchTuple, fetchEncryptedAssetsBatch, useEncryptedAssetsBatch, getEncryptedAssetsBatch)
4. **Expected:** `@lsp-indexer/docs` is NOT listed (it's in changeset ignore list)

### 5. Full monorepo build passes

1. Run `pnpm build` from monorepo root
2. **Expected:** types builds first, then node, then react + next, then docs
3. **Expected:** All 5 packages exit 0 with no TypeScript or MDX errors
4. **Expected:** Docs build generates 22 static pages including `/docs/node`, `/docs/react`, `/docs/next`

## Edge Cases

### MDX syntax validation

1. Run `pnpm build` and grep output for `SyntaxError` or `MDXError`
2. **Expected:** No MDX parse errors — all code blocks and JSX in the docs pages are valid

### Batch function name consistency

1. Grep all three docs pages for the exact function names:
   - `grep "fetchEncryptedAssetsBatch" apps/docs/src/app/docs/node/page.mdx`
   - `grep "useEncryptedAssetsBatch" apps/docs/src/app/docs/react/page.mdx`
   - `grep "useEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx`
   - `grep "getEncryptedAssetsBatch" apps/docs/src/app/docs/next/page.mdx`
2. **Expected:** All grep commands return matches — names are consistent with the actual S01 exports

## Failure Signals

- `pnpm build` exits non-zero — indicates TypeScript compilation error or MDX syntax issue
- Any of the 6 grep checks fail — indicates missing documentation content
- Changeset file missing or incomplete — indicates release won't include all packages

## Not Proven By This UAT

- Runtime correctness of the documented API — docs show usage patterns but don't execute them
- Actual minor version bump behavior — changeset is created but `changeset version` is not run
- Docs rendering quality — MDX compiles but visual layout is not verified (would need browser check of dev server)

## Notes for Tester

- The docs build uses Next.js 16.1.6 with Turbopack — if the build hangs, it's likely a Turbopack issue not related to S02 changes
- The changeset `ignore` list in `.changeset/config.json` excludes `@lsp-indexer/docs` — this is correct and intentional
- Compare the new batch sections against the existing "Batch Follow Checking" sections in each docs page to verify consistent structure
