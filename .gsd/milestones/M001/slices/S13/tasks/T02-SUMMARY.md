---
id: T02
parent: S13
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# T02: 09.1-digital-assets 02

**# Phase 9.1 Plan 02: Digital Asset Parsers + Services Summary**

## What Happened

# Phase 9.1 Plan 02: Digital Asset Parsers + Services Summary

**One-liner:** Hasura→camelCase parser with LSP7/LSP8 standard derivation + 6-field filter/sort service using LSP4_TOKEN_TYPES constants + TkDodo query key factory with separate list/infinite namespaces.

## Objective

Build the internal plumbing layer for digital assets: query key factory, parser (with standard derivation and tokenType mapping), and service functions that translate between the clean public API and Hasura's GraphQL types.

## Tasks Completed

| Task | Name                                          | Commit  | Key Files                                                                                                             |
| ---- | --------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| 1    | Add @lukso/lsp4-contracts + query key factory | ba8baff | packages/node/package.json, packages/node/src/keys/digital-assets.ts                                                  |
| 2    | Create parser and service functions           | 266f452 | packages/node/src/parsers/digital-assets.ts, packages/node/src/services/digital-assets.ts, packages/node/src/index.ts |

## What Was Built

### Task 1: @lukso/lsp4-contracts + Query Key Factory

**Dependency added: `@lukso/lsp4-contracts@0.16.7`** to `packages/node/package.json`

- Required for `LSP4_TOKEN_TYPES` constants (TOKEN→0, NFT→1, COLLECTION→2) used in service filter

**New file: `packages/node/src/keys/digital-assets.ts`**

TkDodo hierarchical query key factory with three separate namespaces:

```ts
digitalAssetKeys.all                              → ['digital-assets']
digitalAssetKeys.details()                        → ['digital-assets', 'detail']
digitalAssetKeys.detail(address, include?)        → ['digital-assets', 'detail', { address, include }]
digitalAssetKeys.lists()                          → ['digital-assets', 'list']
digitalAssetKeys.list(filter?, sort?, limit?, offset?, include?)
                                                  → ['digital-assets', 'list', { filter, sort, limit, offset, include }]
digitalAssetKeys.infinites()                      → ['digital-assets', 'infinite']
digitalAssetKeys.infinite(filter?, sort?, include?) → ['digital-assets', 'infinite', { filter, sort, include }]
```

`list` and `infinite` use separate namespaces to prevent TanStack Query cache corruption between `useQuery` and `useInfiniteQuery`.

### Task 2: Parser and Service Functions

**New file: `packages/node/src/parsers/digital-assets.ts`**

`parseDigitalAsset(raw: RawDigitalAsset): DigitalAsset`

Key transformations:

- **Standard derivation (LOCKED):** `decimals !== undefined && decimals !== null` → `'LSP7'`; `decimals === null` → `'LSP8'`; `decimals === undefined` (field not included) → `null`
- **tokenType mapping:** `"0"` → `TOKEN`, `"1"` → `NFT`, `"2"` → `COLLECTION` via switch statement
- **Image parsing:** structural `RawImage` interface works with both `lsp4_metadata_icon` and `lsp4_metadata_image` types (avoids `__typename` incompatibility)
- **creatorCount:** `Number(lsp4CreatorsLength.value)` (numeric stored as string in Hasura `numeric` scalar)
- All arrays default to `[]`, nullable scalars default to `null`

`parseDigitalAssets(raw: RawDigitalAsset[]): DigitalAsset[]` — convenience wrapper

**New file: `packages/node/src/services/digital-assets.ts`**

Builder functions (internal):

`buildDigitalAssetWhere(filter?)`:

- `name` → `lsp4TokenName.value._ilike '%name%'`
- `symbol` → `lsp4TokenSymbol.value._ilike '%symbol%'`
- `tokenType` → `lsp4TokenType.value._eq LSP4_TOKEN_TYPES[tokenType].toString()`
- `category` → `lsp4Metadata.category.value._ilike '%category%'`
- `holderAddress` → `ownedAssets.owner._ilike holderAddress` (token holders)
- `ownerAddress` → `owner.address._ilike ownerAddress` (contract controller)

`buildDigitalAssetOrderBy(sort?)`:

- `name` → `lsp4TokenName.value asc_nulls_last/desc_nulls_last`
- `symbol` → `lsp4TokenSymbol.value asc_nulls_last/desc_nulls_last`
- `holderCount` → `ownedAssets_aggregate.count direction`
- `creatorCount` → `lsp4CreatorsLength.value direction`
- `totalSupply` → `totalSupply.value direction`
- `createdAt` → `owner.timestamp direction` (LOCKED)

`buildIncludeVars(include?)`:

- `undefined` → `{}` (GraphQL Boolean! = true defaults apply — fetch everything)
- `provided` → each field defaults to `false` unless explicitly `true`

Service functions (exported):

- `fetchDigitalAsset(url, { address, include? }): Promise<DigitalAsset | null>`
- `fetchDigitalAssets(url, { filter?, sort?, limit?, offset?, include? }): Promise<FetchDigitalAssetsResult>`
- `FetchDigitalAssetsResult` interface exported: `{ digitalAssets: DigitalAsset[]; totalCount: number }`

**Modified: `packages/node/src/index.ts`**

Added exports for all digital asset modules:

- `fetchDigitalAsset`, `fetchDigitalAssets`, `FetchDigitalAssetsResult`
- `parseDigitalAsset`, `parseDigitalAssets`
- `digitalAssetKeys`
- `GetDigitalAssetDocument`, `GetDigitalAssetsDocument`

## Decisions Made

| Decision                                                 | Rationale                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Standard derived from `decimals` presence (3-state)      | `undefined` = field not included (null), `null` = LSP8, value = LSP7                           |
| LSP4_TOKEN_TYPES from @lukso/lsp4-contracts              | Authoritative constants, no raw strings exposed                                                |
| holderAddress → ownedAssets.owner (not universalProfile) | owned_asset.owner is a raw address string, not a FK join                                       |
| createdAt sort → owner.timestamp                         | Locked decision from CONTEXT.md; contract owner timestamp = asset creation time                |
| buildIncludeVars returns {} when undefined               | Inverted default pattern — GraphQL Boolean! = true defaults handle the "fetch everything" case |
| Structural RawImage interface                            | Avoids codegen \_\_typename mismatch between lsp4_metadata_icon and lsp4_metadata_image        |

## Deviations from Plan

### None — plan executed exactly as written.

All filter fields, sort fields, include variables, and derivation logic implemented as specified. The `holderAddress` mapping to `ownedAssets.owner._ilike` was confirmed against the `Owned_Asset_Bool_Exp` type which has a direct `owner: String_Comparison_Exp` field.

## Verification Results

- ✅ `@lukso/lsp4-contracts@0.16.7` in packages/node/package.json
- ✅ `pnpm --filter @lsp-indexer/node typecheck` — PASSED
- ✅ `pnpm --filter @lsp-indexer/node build` — PASSED (46.59 KB ESM, 48.31 KB CJS)
- ✅ `digitalAssetKeys.list()` → `['digital-assets', 'list', {}]`
- ✅ `digitalAssetKeys.infinite()` → `['digital-assets', 'infinite', {}]` (different namespaces)
- ✅ `parseDigitalAsset` derives `standard` from `decimals` presence (LSP7/LSP8/null)
- ✅ tokenType `"0"` → `TOKEN`, `"1"` → `NFT`, `"2"` → `COLLECTION`
- ✅ `fetchDigitalAsset` and `fetchDigitalAssets` accept flat params, return clean types
- ✅ No Hasura types leak into public exports

## Next Phase Readiness

Phase 9.1 Plan 03 (hooks + server actions + build validation) can proceed immediately:

- `fetchDigitalAsset` and `fetchDigitalAssets` ready for use in hooks
- `digitalAssetKeys` ready for `queryKey` in `useQuery`/`useInfiniteQuery`
- `FetchDigitalAssetsResult` interface available for return typing in server actions
- All digital asset modules exported from `@lsp-indexer/node`

## Self-Check: PASSED
