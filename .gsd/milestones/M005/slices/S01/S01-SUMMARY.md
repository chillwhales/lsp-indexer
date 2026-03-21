---
id: S01
parent: M005
milestone: M005
provides:
  - EncryptedAssetBatchTupleSchema and UseEncryptedAssetsBatchParamsSchema Zod schemas in types package
  - EncryptedAssetBatchTuple and UseEncryptedAssetsBatchParams inferred TypeScript types
  - encryptedAssetKeys.batches() and encryptedAssetKeys.batch() key factory entries
  - fetchEncryptedAssetsBatch service function with 3-overload include narrowing
  - UseEncryptedAssetsBatchReturn<F> React return type
  - createUseEncryptedAssetsBatch factory with 3-overload include narrowing
  - useEncryptedAssetsBatch concrete React hook
  - getEncryptedAssetsBatch Next.js server action with Zod validation
  - useEncryptedAssetsBatch concrete Next.js hook
requires:
  - slice: none
    provides: first slice in M005
affects:
  - S02
key_files:
  - packages/types/src/encrypted-assets.ts
  - packages/node/src/keys/encrypted-assets.ts
  - packages/node/src/services/encrypted-assets.ts
  - packages/react/src/hooks/types/encrypted-assets.ts
  - packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts
  - packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts
  - packages/next/src/actions/encrypted-assets.ts
  - packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts
key_decisions:
  - D006: Separate fetchEncryptedAssetsBatch function (not extension of fetchEncryptedAssets) due to fundamentally different input/query shape
  - D007: _ilike for address (case-insensitive checksummed), _eq for contentId and revision
  - Batch hook factory uses direct useQuery (not createUseList) since batch results have no totalCount or pagination
patterns_established:
  - _or/_and Hasura where-clause pattern for batch tuple lookups (address _ilike + contentId _eq + revision _eq per tuple)
  - Batch hook factory pattern: direct useQuery + 3-overload include narrowing + stable EMPTY array + enabled guard on tuples.length
  - Batch server action pattern: 3-overload signatures + validateInput with batch params schema + delegate to batch service function
observability_surfaces:
  - Zod validation via UseEncryptedAssetsBatchParamsSchema.parse() throws structured ZodError with .issues
  - Empty-tuple short-circuit returns { encryptedAssets: [] } without network call
  - Build failures surface as non-zero exit with tsc/tsup errors in stderr
  - TanStack Query devtools show ['encryptedAssets', 'batch', tuples, include] key structure
drill_down_paths:
  - .gsd/milestones/M005/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md
duration: 27m
verification_result: passed
completed_at: 2026-03-21
---

# S01: Batch fetch across all packages

**`fetchEncryptedAssetsBatch` service function, React factory + hook, and Next.js server action + hook — all with 3-overload `EncryptedAssetInclude` type narrowing, building across types, node, react, and next packages.**

## What Happened

Built the full batch encrypted asset fetch stack across all four consumer packages in three tasks:

**T01 (types + node):** Added `EncryptedAssetBatchTupleSchema` and `UseEncryptedAssetsBatchParamsSchema` Zod schemas to the types package, plus their inferred TypeScript types. In the node package, added `batches()` and `batch(tuples, include?)` key factory entries and the `fetchEncryptedAssetsBatch` service function. The service function has 3-overload signatures for include type narrowing, short-circuits on empty tuples, and builds `_or` clauses with `_and` per tuple — address uses `_ilike` via `escapeLike()`, contentId and revision use `_eq`. Reuses the existing `GetEncryptedAssetsDocument` and `parseEncryptedAssets`.

**T02 (react):** Added `UseEncryptedAssetsBatchReturn<F>` return type (like `UseEncryptedAssetsReturn` but without `totalCount`). Created `createUseEncryptedAssetsBatch` factory using direct `useQuery` (not `createUseList`, since batch has no pagination) with 3-overload include narrowing, `enabled: tuples.length > 0` guard, and a stable `EMPTY` array reference. Created the concrete `useEncryptedAssetsBatch` hook wired to `fetchEncryptedAssetsBatch(getClientUrl(), params)`.

**T03 (next):** Added `getEncryptedAssetsBatch` server action with 3-overload signatures, Zod validation via `UseEncryptedAssetsBatchParamsSchema`, and delegation to `fetchEncryptedAssetsBatch(getServerUrl(), params)`. Created the concrete Next.js `useEncryptedAssetsBatch` hook wiring the factory to the server action. Updated all barrel index files.

## Verification

All four package builds exit 0 with zero errors:

| Package | Command | Result |
|---------|---------|--------|
| types | `pnpm --filter=@lsp-indexer/types build` | ✅ exit 0 |
| node | `pnpm --filter=@lsp-indexer/node build` | ✅ exit 0 |
| react | `pnpm --filter=@lsp-indexer/react build` | ✅ exit 0 |
| next | `pnpm --filter=@lsp-indexer/next build` | ✅ exit 0 |

Export verification via grep confirmed all new symbols are present in their respective source files and barrel indexes.

## New Requirements Surfaced

- none

## Deviations

- none

## Known Limitations

- No runtime integration test — no test Hasura instance in CI. Batch query correctness relies on type-checked compilation against the GraphQL codegen types and the proven `_or`/`_and` Hasura pattern from `fetchIsFollowingBatch`.
- Docs not yet written (S02 scope).
- Changeset not yet created (S02 scope).
- Docs package build not yet verified (S02 scope).

## Follow-ups

- S02: Write docs page for batch API, create changeset for minor release, verify full 5-package build including docs.

## Files Created/Modified

- `packages/types/src/encrypted-assets.ts` — Added EncryptedAssetBatchTupleSchema, UseEncryptedAssetsBatchParamsSchema, and inferred types
- `packages/node/src/keys/encrypted-assets.ts` — Added batches() and batch() key factory entries
- `packages/node/src/services/encrypted-assets.ts` — Added FetchEncryptedAssetsBatchResult and fetchEncryptedAssetsBatch with 3-overload signatures
- `packages/react/src/hooks/types/encrypted-assets.ts` — Added UseEncryptedAssetsBatchReturn<F> type
- `packages/react/src/hooks/factories/encrypted-assets/create-use-encrypted-assets-batch.ts` — New factory with 3-overload include narrowing
- `packages/react/src/hooks/factories/encrypted-assets/index.ts` — Added barrel export
- `packages/react/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — New concrete hook
- `packages/react/src/hooks/encrypted-assets/index.ts` — Added barrel export
- `packages/next/src/actions/encrypted-assets.ts` — Added getEncryptedAssetsBatch server action
- `packages/next/src/hooks/encrypted-assets/use-encrypted-assets-batch.ts` — New concrete Next.js hook
- `packages/next/src/hooks/encrypted-assets/index.ts` — Added barrel export

## Forward Intelligence

### What the next slice should know
- All batch types, service function, and hooks are exported and building. S02 only needs to document them and create the changeset — no code changes required in the four consumer packages.
- The batch function signature is `fetchEncryptedAssetsBatch(url, { tuples, include? })` returning `{ encryptedAssets: P[] }` (no `totalCount`).
- React hook: `useEncryptedAssetsBatch({ tuples, include? })`. Next.js hook: same signature but routed through `getEncryptedAssetsBatch` server action.

### What's fragile
- Barrel index files in react and next use path-based re-exports (`./use-encrypted-assets-batch`), not symbol names — grep for the symbol name won't match the barrel, grep for the filename will.

### Authoritative diagnostics
- `pnpm --filter=@lsp-indexer/<pkg> build` is the single source of truth for type correctness — non-zero exit with tsc errors for any type mismatch.
- `UseEncryptedAssetsBatchParamsSchema.parse(input)` validates runtime input — throws ZodError with structured `.issues`.

### What assumptions changed
- No assumptions changed — the `_or`/`_and` Hasura pattern, 3-overload include narrowing, and factory hook pattern all worked as expected from `fetchIsFollowingBatch` precedent.
