---
id: S13
parent: M001
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
# S13: Digital Assets

**# Phase 9.1 Plan 01: Digital Asset Types + Codegen Summary**

## What Happened

# Phase 9.1 Plan 01: Digital Asset Types + Codegen Summary

**One-liner:** Zod-first digital asset domain types with inverted include default + GraphQL documents with 17 Boolean! = true variables and regenerated codegen output.

## Objective

Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.

## Tasks Completed

| Task | Name                                     | Commit  | Key Files                                                          |
| ---- | ---------------------------------------- | ------- | ------------------------------------------------------------------ |
| 1    | Create Digital Asset domain types        | 113506a | packages/types/src/digital-assets.ts, packages/types/src/common.ts |
| 2    | Create GraphQL documents and run codegen | 23b6f5a | packages/node/src/documents/digital-assets.ts, graphql.ts, gql.ts  |

## What Was Built

### Task 1: Digital Asset Domain Types (`@lsp-indexer/types`)

**New file: `packages/types/src/common.ts`**

- `SortDirectionSchema` — shared across all domain sort schemas (moved from profiles.ts)
- `SortDirection` — inferred type

**New file: `packages/types/src/digital-assets.ts`** with all schemas:

- `StandardSchema` — `z.enum(['LSP7', 'LSP8'])` for parser-derived standard
- `TokenTypeSchema` — `z.enum(['TOKEN', 'NFT', 'COLLECTION'])` — clean strings, no raw 0/1/2
- `DigitalAssetImageSchema` — url, width?, height?, verification? (matches ProfileImageSchema pattern)
- `DigitalAssetLinkSchema` — title, url
- `DigitalAssetAttributeSchema` — key, value, type (NFT trait attributes)
- `DigitalAssetOwnerSchema` — address + timestamp (contract controller)
- `DigitalAssetSchema` — full type with all 15+ fields including nullable LSP8-specific fields
- `DigitalAssetFilterSchema` — 6 fields: name, symbol, tokenType, category, holderAddress, ownerAddress
- `DigitalAssetSortFieldSchema` — 6 sort fields including createdAt
- `DigitalAssetSortSchema` — field + direction (uses shared SortDirectionSchema)
- `DigitalAssetIncludeSchema` — 17 optional boolean fields with **inverted-default JSDoc**
- `UseDigitalAssetParamsSchema` — address + optional include
- `UseDigitalAssetsParamsSchema` — filter? + sort? + limit? + offset? + include?
- `UseInfiniteDigitalAssetsParamsSchema` — filter? + sort? + pageSize? + include?

**Modified: `packages/types/src/profiles.ts`**

- Imports `SortDirectionSchema` from `./common` instead of defining inline
- Re-exports for backward compatibility

**Modified: `packages/types/src/index.ts`**

- Exports `SortDirectionSchema` and `SortDirection` from `./common` (canonical source)
- Exports all new digital asset schemas and inferred types

### Task 2: GraphQL Documents + Codegen (`@lsp-indexer/node`)

**New file: `packages/node/src/documents/digital-assets.ts`**

`GetDigitalAssetDocument` — Single asset query with:

- `$where: digital_asset_bool_exp!` for the filter
- 17 `Boolean! = true` variables for all includable fields
- Queries: `lsp4TokenName`, `lsp4TokenSymbol`, `lsp4TokenType`, `decimals`, `totalSupply`
- `lsp4Metadata` sub-fields: `description`, `category`, `icon`, `images`, `links`, `attributes`
- `owner { address, timestamp }` for contract controller
- `ownedAssets_aggregate` for holderCount
- `lsp4CreatorsLength { value }` for creatorCount
- LSP8: `lsp8ReferenceContract`, `lsp8TokenIdFormat`, `lsp8TokenMetadataBaseUri`

`GetDigitalAssetsDocument` — List query with pagination + total count:

- Same include variables + `$order_by`, `$limit`, `$offset`
- `digital_asset_aggregate(where: $where)` for total count UI

**Codegen output updated: `packages/node/src/graphql/graphql.ts` + `gql.ts`**

- `GetDigitalAssetQuery` and `GetDigitalAssetQueryVariables` types generated
- `GetDigitalAssetsQuery` and `GetDigitalAssetsQueryVariables` types generated
- Full Hasura type coverage for all selected fields

## Decisions Made

| Decision                                              | Rationale                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SortDirectionSchema` moved to `common.ts`            | Avoid duplication across domains; profiles.ts re-exports for backward compat                      |
| Inverted include default (all true)                   | Digital assets fetch everything by default — richer out-of-box experience                         |
| `lsp4Metadata` always fetched (no top-level @include) | Sub-fields use individual @include directives; metadata itself is always needed for nested access |
| `ownedAssets_aggregate` for holderCount               | Counts unique asset holders via owned_asset table join                                            |
| `lsp4CreatorsLength.value` (numeric) for creatorCount | Creator count stored as numeric value in lsp4_creators_length table                               |

## Deviations from Plan

### None — plan executed exactly as written.

The `SortDirectionSchema` move to `common.ts` was explicitly called for in the plan. All schemas created as specified with correct field names verified against `schema.graphql`.

## Verification Results

- ✅ `pnpm --filter @lsp-indexer/types typecheck` — PASSED
- ✅ `pnpm --filter @lsp-indexer/types build` — PASSED (12.18 KB ESM, 15.76 KB CJS)
- ✅ `pnpm codegen` — PASSED (no errors, documents generated)
- ✅ `pnpm --filter @lsp-indexer/node typecheck` — PASSED
- ✅ `packages/types/src/digital-assets.ts` exports: DigitalAsset, TokenType, Standard, DigitalAssetFilter, DigitalAssetSort, DigitalAssetInclude
- ✅ `packages/node/src/documents/digital-assets.ts` exports: GetDigitalAssetDocument, GetDigitalAssetsDocument
- ✅ `packages/node/src/graphql/graphql.ts` contains GetDigitalAssetQuery, GetDigitalAssetsQuery types

## Next Phase Readiness

Phase 9.1 Plan 02 (parsers + services + query key factory) can proceed immediately:

- All Zod schemas available for parser validation
- `GetDigitalAssetQuery` and `GetDigitalAssetsQuery` Hasura types available for type-safe parsing
- `DigitalAsset` type is the parser output target
- `DigitalAssetFilter`, `DigitalAssetSort`, `DigitalAssetInclude` available for service layer input

## Self-Check: PASSED

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

# Phase 9.1 Plan 03: Digital Asset Hooks + Server Actions + Build Validation Summary

**One-liner:** Three TanStack Query hooks in @lsp-indexer/react (direct Hasura) + three hooks + two server actions in @lsp-indexer/next (routed via 'use server') — all 4 packages build and typecheck clean.

## Objective

Create consumer-facing hooks for both @lsp-indexer/react and @lsp-indexer/next, server actions, and wire all digital asset exports through every package entry point.

## Tasks Completed

| Task | Name                                                          | Commit  | Key Files                                                                                                                          |
| ---- | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Create React hooks, Next.js server actions, and Next.js hooks | 4b2d5f6 | packages/react/src/hooks/digital-assets.ts, packages/next/src/actions/digital-assets.ts, packages/next/src/hooks/digital-assets.ts |
| 2    | Wire entry points and validate builds                         | 0b1a453 | packages/react/src/index.ts, packages/next/src/index.ts                                                                            |

## What Was Built

### Task 1: Hooks and Server Actions

**New file: `packages/react/src/hooks/digital-assets.ts`**

Three TanStack Query hooks calling Hasura directly from the browser via `getClientUrl()`:

- **`useDigitalAsset(params)`** — `useQuery` wrapping `fetchDigitalAsset`, disabled when address is falsy, returns `{ digitalAsset: data ?? null, ...rest }`
- **`useDigitalAssets(params?)`** — `useQuery` wrapping `fetchDigitalAssets`, returns `{ digitalAssets: data?.digitalAssets ?? [], totalCount: data?.totalCount ?? 0, ...rest }`
- **`useInfiniteDigitalAssets(params?)`** — `useInfiniteQuery` with offset pagination, flattened pages via `useMemo`, returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`

**New file: `packages/next/src/actions/digital-assets.ts`**

Two Next.js server actions with `'use server'` directive:

- **`getDigitalAsset(address, include?)`** — runs `fetchDigitalAsset` server-side via `getServerUrl()`
- **`getDigitalAssets(params?)`** — runs `fetchDigitalAssets` server-side via `getServerUrl()`

**New file: `packages/next/src/hooks/digital-assets.ts`**

Three TanStack Query hooks identical in API to @lsp-indexer/react, but routing through server actions as queryFn:

- **`useDigitalAsset`**, **`useDigitalAssets`**, **`useInfiniteDigitalAssets`** — same return shapes, use `digitalAssetKeys` from `@lsp-indexer/node`, call `getDigitalAsset`/`getDigitalAssets` server actions

### Task 2: Entry Points + Build Validation

**Updated `packages/react/src/index.ts`:**

```typescript
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';
```

**Updated `packages/next/src/index.ts`:**

```typescript
export { getDigitalAsset, getDigitalAssets } from './actions/digital-assets';
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';
```

**`packages/node/src/index.ts`:** Already had all digital asset exports from plan 02 — no changes needed.

**All 4 packages built and typechecked clean:**

- `@lsp-indexer/types` ✅ build + typecheck
- `@lsp-indexer/node` ✅ build + typecheck
- `@lsp-indexer/react` ✅ build + typecheck
- `@lsp-indexer/next` ✅ build + typecheck

## Key Patterns Applied

### TS2783 Avoidance

Infinite query properties destructured before rest spread:

```typescript
const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
```

This prevents TypeScript error TS2783 ("property would overwrite") when the same property appears in both the result object and the spread.

### Separate Query Key Namespaces

`useDigitalAssets` uses `digitalAssetKeys.list(...)` → `['digital-assets', 'list', ...]`
`useInfiniteDigitalAssets` uses `digitalAssetKeys.infinite(...)` → `['digital-assets', 'infinite', ...]`

These are fundamentally different data structures in TanStack Query cache (single result vs. pages array). Separate namespaces prevent cache corruption at runtime.

### Dual-Package Hook Pattern

Same hook API exposed from two packages with different transport layers:

- `@lsp-indexer/react`: hooks call Hasura directly (getClientUrl) — for apps exposing the endpoint
- `@lsp-indexer/next`: hooks call server actions — for apps keeping endpoint hidden from browser

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- **Phase 9.1 Plan 04 (playground UI):** All hooks importable from `@lsp-indexer/react` and `@lsp-indexer/next`. Digital asset API is complete.
- **Available from `@lsp-indexer/node`:** `fetchDigitalAsset`, `fetchDigitalAssets`, `digitalAssetKeys`, `parseDigitalAsset`, `parseDigitalAssets`, `FetchDigitalAssetsResult`, `GetDigitalAssetDocument`, `GetDigitalAssetsDocument`
- **Available from `@lsp-indexer/react`:** `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets`
- **Available from `@lsp-indexer/next`:** `getDigitalAsset`, `getDigitalAssets`, `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets`
- **Available from `@lsp-indexer/types`:** `DigitalAsset`, `DigitalAssetFilter`, `DigitalAssetSort`, `DigitalAssetInclude`, `TokenType`, `UseDigitalAssetParams`, `UseDigitalAssetsParams`, `UseInfiniteDigitalAssetsParams`

## Self-Check: PASSED

# Phase 9.1 Plan 04: Digital Assets Playground + E2E Verification Summary

**One-liner:** Three-tab playground page at `/digital-assets` with color-coded LSP7/LSP8 badges, client/server mode toggle, and cross-cutting parser/service/type improvements that propagate the validated pattern to profiles too.

## Objective

Build the test app digital assets playground page proving the entire vertical slice works end-to-end against live Hasura data. Also includes post-plan polish and refinements discovered during E2E validation — all merged as part of PR #193.

## Tasks Completed

| Task | Name                                                      | Commit  | Key Files                                                                            |
| ---- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| 1    | Build digital assets playground page                      | 1702c2b | apps/test/src/app/digital-assets/layout.tsx, page.tsx, nav.tsx                       |
| 2    | Refactor: extract escapeLike to shared utils              | 8dc1633 | packages/node/src/services/utils.ts                                                  |
| 3    | Fix: correct env var refs in server action JSDoc          | 39778ea | packages/next/src/actions/digital-assets.ts, profiles.ts                             |
| 4    | Refactor: simplify barrel exports to export \*            | a8cec5e | packages/types/src/index.ts, packages/react/src/index.ts, packages/next/src/index.ts |
| 5    | Fix: display token details as list, render icons/images   | 944581e | apps/test/src/app/digital-assets/page.tsx                                            |
| 6    | Fix: token type select, full addresses, simplified filter | a1b36a6 | apps/test/src/app/digital-assets/page.tsx, playground/filter-field.tsx               |
| 7    | Feat: digital asset + profile polish (cross-cutting)      | b16b33f | packages/types, packages/node, apps/test (19 files)                                  |
| 8    | Fix: escapeLike backslash safety, BigInt formatter, JSDoc | fc0c44e | apps/test/src/lib/utils.ts, packages/node parsers/services                           |

## What Was Built

### Task 1: Digital Assets Playground Page

**New file: `apps/test/src/app/digital-assets/layout.tsx`**

Force-dynamic layout (same as profiles) — prevents Next.js static generation for the playground page.

**New file: `apps/test/src/app/digital-assets/page.tsx`** (originally 780 lines, later refactored)

Three-tab playground exercising all three hooks in both client and server modes:

- **Single Asset tab:** Address input + preset buttons (CHILL LSP7, Chillwhales LSP8) + include toggles + detailed `DigitalAssetCard` with full LSP4 metadata section + conditional LSP8 section (`referenceContract`, `tokenIdFormat`, `baseUri` only when `standard === 'LSP8'`)
- **Asset List tab:** `FilterFieldsRow` (6 fields) + `SortControls` (6 fields) + include toggles + `ResultsList<DigitalAsset>` with compact cards + total count
- **Infinite Scroll tab:** Same filter/sort controls + infinite scroll via `useInfiniteDigitalAssets` + Load More button with `isFetchingNextPage` state

**Color-coded `StandardBadge` component (locked from CONTEXT.md):**

- LSP7 TOKEN → blue (`bg-blue-100 text-blue-800`)
- LSP7 NFT → purple (`bg-purple-100 text-purple-800`)
- LSP8 NFT → orange (`bg-orange-100 text-orange-800`)
- LSP8 COLLECTION → yellow (`bg-yellow-100 text-yellow-800`)

**Mode toggle:** `key={mode}` on parent element forces React remount when switching, avoiding hook-rule violations from conditional hook calls.

**Updated `apps/test/src/components/nav.tsx`:** `/digital-assets` route, `available: true` (was `/assets`, `available: false`).

### Tasks 2–8: Post-Plan Polish & Cross-Cutting Improvements

These were discovered during E2E validation and fixed before PR merge:

**`escapeLike` shared utility (`packages/node/src/services/utils.ts`):**

- Extracted from both `profiles.ts` and `digital-assets.ts` into a shared utility
- Added backslash escaping (`\\` before `%` and `_`) for PostgreSQL LIKE safety
- Applied to `holderAddress`, `ownerAddress`, and address lookup fields to prevent wildcard injection

**`SortNulls` type (`packages/types/src/common.ts`):**

- New `SortNulls = 'first' | 'last' | 'default'` type
- `orderDir(direction, nulls)` helper in `services/utils.ts` — maps to `asc_nulls_last` / `desc_nulls_last` / etc.
- Wired through `DigitalAssetSort`, `ProfileSort` schemas and service sort builders

**Array fields `T[] | null` pattern (`packages/types/src/digital-assets.ts`, `profiles.ts`):**

- Icons, images, links, attributes, tags, avatar, profileImage, backgroundImage changed from `T[]` to `T[] | null`
- `null` = field not included in query; `[]` = fetched but legitimately empty
- Parsers updated to return `null` when field not included vs `[]` when included but empty

**`DigitalAssetCard` and `ProfileCard` as separate components:**

- Extracted to `apps/test/src/components/digital-asset-card.tsx` and `profile-card.tsx`
- Pages become thin orchestrators importing card components — consistent pattern for all future domains

**`FilterFieldConfig` gains `options[]` (`apps/test/src/components/playground/filter-field.tsx`):**

- When `options` provided, renders shadcn `Select` instead of `Input`
- Token Type filter uses `['TOKEN', 'NFT', 'COLLECTION']` options + All reset
- `buildDigitalAssetFilter` simplified — no manual toUpperCase/validation

**`formatTokenAmount` (`apps/test/src/lib/utils.ts`):**

- BigInt-safe formatting for uint256 total supply values
- Extracted `bigintFixed` and `bigintCompact` helpers (1B, 420K notation)
- Raw uint256 shown in tooltip, formatted value in UI

**`numericToString` (`packages/node/src/parsers/utils.ts`):**

- Hasura `numeric` scalar is typed as `string` in codegen — `numericToString` handles both string and number defensively

**`export *` barrel pattern:**

- `packages/types/src/index.ts`, `packages/react/src/index.ts`, `packages/next/src/index.ts` simplified from verbose named re-exports to `export *` from each domain file
- Reduces maintenance overhead when adding new exports to domain files

**`@lukso/lsp4-contracts` removed:**

- Only used for 3 integer constants (TOKEN=0, NFT=1, COLLECTION=2) — inlined directly
- Removes a runtime dependency from `@lsp-indexer/node`

## Decisions Made

| Decision                                  | Rationale                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `SortNulls` type + `orderDir()` helper    | Profiles and digital assets both need null-last sorting — centralized pattern avoids drift          |
| `T[] \| null` for array fields            | Clean semantic distinction between "not fetched" (null) and "fetched but empty" ([])                |
| Extracted card components                 | Pages should orchestrate, not define UI — prepares pattern for 9 more domains                       |
| `FilterFieldConfig.options[]` for select  | Enum filters (tokenType) need select UI, not free text — prevents invalid filter values             |
| BigInt arithmetic in `formatTokenAmount`  | `Number()` loses precision on large uint256 values (> 2^53)                                         |
| `export *` over explicit named re-exports | Named re-exports require maintenance every time a domain adds a new export; `export *` is automatic |
| Remove `@lukso/lsp4-contracts` dep        | 3 integer constants don't justify a runtime dependency                                              |

## Deviations from Plan

### Auto-fixed Issues (Rules 1–3)

All post-plan commits were Rule 1 (bugs) or Rule 2 (missing critical functionality) fixes discovered during E2E validation:

**[Rule 1 - Bug] tokenType filter accepted free text — rejected non-uppercase input**

- Found during: E2E validation
- Fix: Replaced text input with Select component using TOKEN/NFT/COLLECTION options
- Commit: a1b36a6

**[Rule 1 - Bug] totalSupply displayed in scientific notation (1e+21)**

- Found during: E2E validation with Chillwhales (large uint256 supply)
- Fix: `numericToString` in parsers, `formatTokenAmount` with BigInt arithmetic
- Commits: b16b33f, fc0c44e

**[Rule 1 - Bug] `escapeLike` duplicated between profiles.ts and digital-assets.ts; missing backslash escape**

- Found during: Code review of PR #193
- Fix: Extracted to shared `services/utils.ts`, added `\\` escaping before `%` and `_`
- Commits: 8dc1633, fc0c44e

**[Rule 2 - Missing Critical] Array fields ambiguous between "not fetched" and "fetched but empty"**

- Found during: E2E validation (include toggles not clearly conveying fetch state)
- Fix: Changed to `T[] | null` — null = not fetched, [] = fetched but empty
- Commit: b16b33f

**[Rule 2 - Missing Critical] Server action JSDoc referenced wrong env var names**

- Found during: Code review
- Fix: Updated JSDoc to reference `INDEXER_URL` / `NEXT_PUBLIC_INDEXER_URL` (what `getServerUrl()` actually reads)
- Commit: 39778ea

## Verification Results

- ✅ `apps/test/src/app/digital-assets/page.tsx` exists
- ✅ `apps/test/src/app/digital-assets/layout.tsx` exists with `force-dynamic`
- ✅ Nav shows Digital Assets as `available: true` with `/digital-assets` route
- ✅ `StandardBadge` renders 4 distinct color variants (blue/purple/orange/yellow)
- ✅ Single asset tab: full card + LSP4 metadata + conditional LSP8 section
- ✅ List tab: 6 filters, 6 sorts, include toggles, total count
- ✅ Infinite scroll tab: load more, `hasNextPage`, `isFetchingNextPage` states
- ✅ Client/server mode toggle: `key={mode}` forces clean remount
- ✅ Preset addresses: CHILL (`0x5B8B...B14`) and Chillwhales (`0x86E8...A83`)
- ✅ All 4 packages build and typecheck clean post-refactor
- ✅ PR #193 merged to `refactor/indexer-v2-react`

## Next Phase Readiness

Phase 9.2 (NFTs) can proceed immediately. Established patterns to follow:

- **Playground pattern:** Three-tab page → extract `{Domain}Card` component → `FilterFieldConfig` with `options[]` for enum fields → `T[] | null` for array fields
- **Sort pattern:** `orderDir(direction, nulls)` in service sort builders — pass through `SortNulls` from schema
- **Barrel exports:** `export *` from domain file in all package index.ts files
- **Parser utils:** `numericToString` from `packages/node/src/parsers/utils.ts` for Hasura `numeric` scalar
- **Service utils:** `escapeLike` from `packages/node/src/services/utils.ts` for all string filter fields

## Self-Check: PASSED
