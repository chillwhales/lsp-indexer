---
id: T04
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
# T04: 09.1-digital-assets 04

**# Phase 9.1 Plan 04: Digital Assets Playground + E2E Verification Summary**

## What Happened

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
