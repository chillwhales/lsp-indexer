---
id: M005
provides:
  - fetchEncryptedAssetsBatch service function with _or/_and Hasura where-clauses and 3-overload EncryptedAssetInclude narrowing
  - EncryptedAssetBatchTupleSchema and UseEncryptedAssetsBatchParamsSchema Zod schemas with inferred types
  - encryptedAssetKeys.batch() and encryptedAssetKeys.batches() query key factory entries
  - createUseEncryptedAssetsBatch React factory and useEncryptedAssetsBatch concrete hook
  - getEncryptedAssetsBatch Next.js server action with Zod validation
  - useEncryptedAssetsBatch Next.js hook routing through server action
  - Batch encrypted asset documentation across node, react, and next docs pages
  - Changeset for minor release of @lsp-indexer/{types,node,react,next}
key_decisions:
  - D006: Separate fetchEncryptedAssetsBatch function (not extension of fetchEncryptedAssets) — different input/query shape
  - D007: _ilike for address (case-insensitive checksummed), _eq for contentId and revision
  - D008: Direct useQuery for batch hook factory (not createUseList) — no pagination needed
patterns_established:
  - _or/_and Hasura where-clause pattern for batch tuple lookups (address _ilike + contentId _eq + revision _eq per tuple)
  - Batch hook factory using direct useQuery with 3-overload include narrowing, enabled guard on tuples.length, and stable EMPTY array
  - Batch server action pattern with 3-overload signatures, Zod validation, and delegation to batch service function
observability_surfaces:
  - Zod validation via UseEncryptedAssetsBatchParamsSchema.parse() throws structured ZodError with .issues
  - Empty-tuple short-circuit returns { encryptedAssets: [] } without network call
  - TanStack Query devtools show ['encryptedAssets', 'batch', tuples, include] key structure
  - pnpm build across all 5 packages is the single authoritative verification gate
requirement_outcomes:
  - id: R009
    from_status: active
    to_status: validated
    proof: fetchEncryptedAssetsBatch builds _or/_and where-clauses with _ilike for address, _eq for contentId and revision. pnpm --filter=@lsp-indexer/node build exits 0. Docs document the function.
  - id: R010
    from_status: active
    to_status: validated
    proof: fetchEncryptedAssetsBatch, createUseEncryptedAssetsBatch, and getEncryptedAssetsBatch all use 3-overload <const I extends EncryptedAssetInclude> pattern. All 4 consumer packages build with zero errors.
  - id: R011
    from_status: active
    to_status: validated
    proof: useEncryptedAssetsBatch React hook via factory + useEncryptedAssetsBatch Next.js hook via server action, both with EncryptedAssetInclude narrowing. pnpm build exits 0 for react and next.
duration: 42m
verification_result: passed
completed_at: 2026-03-21
---

# M005: Batch Encrypted Asset Fetch

**Batch fetch of encrypted assets by `(address, contentId, revision)` tuples across all four consumer packages — service function, React and Next.js hooks with 3-overload include narrowing, docs, and changeset.**

## What Happened

M005 delivered the ability to fetch multiple encrypted assets in a single Hasura round trip, using the `_or`/`_and` where-clause pattern proven by `fetchIsFollowingBatch`.

**S01** built the full stack across four packages. The types package gained `EncryptedAssetBatchTupleSchema` and `UseEncryptedAssetsBatchParamsSchema` Zod schemas. The node package gained `fetchEncryptedAssetsBatch` — a service function with 3-overload `EncryptedAssetInclude` narrowing that builds one `_and` clause per tuple (address `_ilike`, contentId `_eq`, revision `_eq`) wrapped in `_or`. It reuses the existing `GetEncryptedAssetsDocument` and `parseEncryptedAssets`. The react package gained `createUseEncryptedAssetsBatch` factory using direct `useQuery` (not `createUseList` — batch has no pagination) with a stable `EMPTY` array and `enabled: tuples.length > 0` guard, plus the concrete `useEncryptedAssetsBatch` hook. The next package gained `getEncryptedAssetsBatch` server action with Zod validation and the concrete `useEncryptedAssetsBatch` hook.

**S02** documented the batch API across all three docs pages following the established pattern from M003's batch follow checking sections, created the changeset for minor release of all four packages, and verified the full 5-package build (types → node → react → next → docs) exits 0 with zero errors.

## Cross-Slice Verification

Each success criterion from the roadmap was verified:

| Criterion | Evidence |
|-----------|----------|
| `fetchEncryptedAssetsBatch` accepts array of tuples, returns in one query | Service function at line 331 of `packages/node/src/services/encrypted-assets.ts` builds `_or` with `_and` per tuple. Build exits 0. |
| Address uses `_ilike`, contentId and revision use `_eq` | Lines 355-358: `{ address: { _ilike: escapeLike(t.address) } }, { content_id: { _eq: t.contentId } }, { revision: { _eq: t.revision } }` |
| React and Next.js hooks with full `EncryptedAssetInclude` type narrowing | Both packages export `useEncryptedAssetsBatch` with 3-overload include narrowing. `pnpm build` exits 0 for react and next. |
| Docs document the batch API | `grep` confirms `fetchEncryptedAssetsBatch` in node docs, `useEncryptedAssetsBatch` in react and next docs. |
| Changeset ready for minor release | `.changeset/add-encrypted-assets-batch.md` lists all 4 packages as `minor`. |
| `pnpm build` exits 0 across all 5 packages | Full build completes successfully, docs generate all static pages. |

Definition of done verified: both slices marked `[x]`, both slice summaries exist with `verification_result: passed`, S01→S02 boundary (all batch types/functions/hooks exported and building) confirmed by S02's successful docs build.

## Requirement Changes

- R009: active → validated — `fetchEncryptedAssetsBatch` builds `_or`/`_and` where-clauses with `_ilike` for address, `_eq` for contentId/revision. Node package builds with zero errors. Docs document the function.
- R010: active → validated — All three consumer entry points (service function, React factory, Next.js server action) use 3-overload `<const I extends EncryptedAssetInclude>` pattern. All 4 packages compile.
- R011: active → validated — React hook via `createUseEncryptedAssetsBatch` factory + Next.js hook via `getEncryptedAssetsBatch` server action with Zod validation. Both packages build successfully.

R012, R013, R014 were already marked validated by S02.

## Forward Intelligence

### What the next milestone should know
- The `_or`/`_and` batch tuple pattern is now used by two domains (followers, encrypted assets). Any future batch-by-tuple feature can follow the same pattern: build `_and` per tuple inside `_or`, reuse the existing query document with a dynamically constructed where-clause.
- Batch hooks use `useQuery` directly, not `createUseList` — this is the correct pattern when results have no `totalCount` or pagination.
- All four consumer packages are in a changesets fixed group — one changeset bumps all together.

### What's fragile
- MDX docs are not type-checked against actual exports — if function signatures change in a future milestone, docs examples will silently drift.
- Barrel index files in react and next use path-based re-exports (`./use-encrypted-assets-batch`), not symbol names — grep for the symbol name won't match the barrel.

### Authoritative diagnostics
- `pnpm build` is the single authoritative gate — it builds types → node → react → next → docs in dependency order and catches both TypeScript and MDX errors.
- `UseEncryptedAssetsBatchParamsSchema.parse(input)` validates runtime input — throws ZodError with structured `.issues`.

### What assumptions changed
- No assumptions changed — the `_or`/`_and` Hasura pattern, 3-overload include narrowing, and factory hook pattern all worked exactly as expected from the `fetchIsFollowingBatch` precedent.

## Files Created/Modified

- `packages/types/src/encrypted-assets.ts` — Added EncryptedAssetBatchTupleSchema, UseEncryptedAssetsBatchParamsSchema, and inferred types
- `packages/node/src/keys/encrypted-assets.ts` — Added batches() and batch() key factory entries
- `packages/node/src/services/encrypted-assets.ts` — Added fetchEncryptedAssetsBatch with 3-overload signatures and _or/_and where-clause
- `packages/react/src/hooks/types/encrypted-assets.ts` — Added UseEncryptedAssetsBatchReturn<F> type
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts` — New factory with 3-overload include narrowing
- `packages/react/src/hooks/factories/encrypted-assets/index.ts` — Added barrel export
- `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — New concrete hook
- `packages/react/src/hooks/encrypted-assets/index.ts` — Added barrel export
- `packages/next/src/actions/encrypted-assets.ts` — Added getEncryptedAssetsBatch server action
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — New concrete Next.js hook
- `packages/next/src/hooks/encrypted-assets/index.ts` — Added barrel export
- `apps/docs/src/app/docs/node/page.mdx` — Batch encrypted asset fetch documentation
- `apps/docs/src/app/docs/react/page.mdx` — Batch encrypted asset hook documentation
- `apps/docs/src/app/docs/next/page.mdx` — Batch encrypted asset server action and hook documentation
- `.changeset/add-encrypted-assets-batch.md` — Changeset for minor release of all four consumer packages
