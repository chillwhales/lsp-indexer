# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 9 restructured into per-domain sub-phases (9.1–9.9)

## Current Position

- **Phase:** 9 of 11 (Remaining Query Domains — 9 sub-phases)
- **Sub-phase:** 9.2 (NFTs) — not yet started
- **Status:** Phase 9.1 complete (all 4 plans done, PR #193 merged) — QUERY-02 + PAGE-01 delivered
- **Last activity:** 2026-02-20 — Completed 09.1-04-PLAN.md (digital-assets-playground-e2e)
- **Progress:** ████░░░░░░ 39% (11/28 requirements)

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                               | Requirements | Status   |
| ----- | ---------------------------------- | :----------: | -------- |
| 7     | Package Foundation                 |     7/7      | Complete |
| 8     | First Vertical Slice (Profiles)    |     3/3      | Complete |
| 9.1   | Digital Assets                     |     1/1      | Complete |
| 9.2   | NFTs                               |      1       | Pending  |
| 9.3   | Owned Assets                       |      1       | Pending  |
| 9.4   | Social / Follows                   |      1       | Pending  |
| 9.5   | Creators                           |      1       | Pending  |
| 9.6   | Encrypted Assets                   |      1       | Pending  |
| 9.7   | Encrypted Feed                     |      1       | Pending  |
| 9.8   | Data Changed Events                |      1       | Pending  |
| 9.9   | Universal Receiver Events          |      1       | Pending  |
| 10    | Subscriptions                      |      3       | Pending  |
| 11    | Server Actions & Publish Readiness |      4       | Pending  |

_Note:_ Phase 9 has 10 requirements total: 9 QUERY requirements (one per sub-phase) plus PAGE-01 which is delivered incrementally across all sub-phases and counted once globally.

**Total:** 11/28 requirements delivered (FOUND-01–07, QUERY-01, QUERY-02, DX-01, DX-02)

## Performance Metrics

- **Plans completed:** 49 (36 v1.0 + 13 v1.1)
- **Plans failed:** 0
- **Phases completed:** 14 (11 v1.0 + 3 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 11/28 (v1.1)

## Accumulated Context

### Key Decisions

See `.planning/PROJECT.md` Key Decisions table for full record.

**v1.1 decisions:**

- 4 packages: `@lsp-indexer/types`, `@lsp-indexer/node`, `@lsp-indexer/react`, `@lsp-indexer/next` in lsp-indexer monorepo
- Three consumption patterns: queries (TanStack Query via `@lsp-indexer/react`), subscriptions (graphql-ws), server actions (`'use server'` via `@lsp-indexer/next`)
- GraphQL codegen from Hasura schema, types committed to `packages/node`
- **Branch workflow: ALL v1.1 work merges via PRs to `refactor/indexer-v2-react`** — see PROJECT.md "Branching & PR Workflow" for full protocol
- Reference: `chillwhales/marketplace` graphql package and web hooks (being standardized)
- Vertical-slice approach: build Universal Profiles end-to-end first, then replicate across 10 domains
- Minimal runtime deps — only `graphql-ws` for subscriptions; typed fetch wrapper for queries (zero query deps)
- 4 separate packages replace old multi-entry-point approach: `@lsp-indexer/types` (was `/types`), `@lsp-indexer/node` (was `/server`), `@lsp-indexer/react` (hooks), `@lsp-indexer/next` (server actions)
- Parser layer transforms Hasura snake_case → clean camelCase types
- `graphql-ws` for WebSocket subscriptions (Hasura supports natively)
- `graphql` is devDependency only (codegen build-time, not shipped)
- Phase numbering continues from v1.0: Phases 7–11
- schema.graphql auto-generated from Hasura introspection via `pnpm schema:dump` (full 25k-line schema, not hand-maintained)
- Exports map uses split import/require conditions with separate .d.ts/.d.cts types
- typesVersions used for node10 resolution fallback
- treeshake disabled on tsup entries to preserve "use client" banner
- React 19 removes global JSX namespace — use React.ReactNode return types in components
- outputFileTracingRoot needed in next.config.ts for monorepo workspace root detection
- **UI: Always use shadcn/ui components over custom components** — Tailwind CSS v4 + shadcn/ui (new-york style) is the standard for all UI in apps/test and future consumer apps. No inline styles, no custom components when a shadcn equivalent exists.
- Next.js 16 for test app (Turbopack default, React 19.2 canary features)
- Codegen always reads local schema.graphql (no env-var fallback branching)
- All image types (avatar, profileImage, backgroundImage) share ProfileImage interface with nullable width/height
- Structural interface for image parsing (avoids codegen \_\_typename incompatibility between profile_image and background_image)
- tokenOwned filter branches into owned_tokens (with tokenId) vs owned_assets (without tokenId)
- Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
- **4-package architecture:** `@lsp-indexer/types` (Zod schemas, zero deps) ← `@lsp-indexer/node` (services, parsers, documents, codegen, keys, execute, errors) ← `@lsp-indexer/react` (thin TanStack Query hooks) and `@lsp-indexer/node` ← `@lsp-indexer/next` (server actions + hooks)
- **No re-exports across packages — single source of truth.** Each export lives in exactly one package. Consumers import from the source: types from `@lsp-indexer/types`, services/errors/keys from `@lsp-indexer/node`, hooks from `@lsp-indexer/react` or `@lsp-indexer/next`. No convenience re-exports, no barrel forwarding between packages.
- **Server actions use `'use server'` directive** — Next.js-only, hence `@lsp-indexer/next` package name
- **Hasura uses camelCase field names** (lsp3Profile, followedBy, ownedAssets) — not snake_case. Schema.graphql updated to match.
- **All address/tokenId comparisons use `_ilike`** for case-insensitive matching (EIP-55 mixed-case prevention)
- **Name sort uses `asc_nulls_last` / `desc_nulls_last`** — profiles without names sort last
- **Search inputs have 300ms debounce** — prevents excessive GraphQL queries
- **Labels on top of inputs** — not beside (consistent with shadcn form patterns)
- **Shared playground components** in `components/playground/` — FilterFieldsRow, SortControls, ResultsList<T>, useFilterFields, ErrorAlert, RawJsonToggle. New domains only need config arrays + domain card component.
- **Digital asset standard derivation:** parser derives `standard` from `decimals` field (3-state: undefined = not included → null, null = LSP8, value = LSP7)
- **tokenType raw mapping:** Hasura stores "0"/"1"/"2" strings → parser maps to TOKEN/NFT/COLLECTION
- **holderAddress filter:** maps to `ownedAssets.owner._ilike` (token holders via owned_asset.owner direct address field)
- **createdAt sort:** maps to `owner.timestamp` (contract owner timestamp = asset creation time, LOCKED)
- **@lukso/lsp4-contracts removed:** constants inlined in parser — dep was only needed for 3 integer values
- **SortNulls type + orderDir() helper:** `SortNulls = 'first' | 'last' | 'default'` in common.ts; `orderDir(direction, nulls)` maps to `asc_nulls_last` etc. — wired through all sort builders
- **Array fields `T[] | null`:** null = field not included in query, [] = fetched but empty — clean semantic distinction for include toggles
- **`export *` barrel pattern:** all package index.ts files use `export *` from domain files — eliminates per-export maintenance
- **`escapeLike` shared utility:** extracted to `packages/node/src/services/utils.ts` — applied to all string filter fields to prevent PostgreSQL LIKE wildcard injection (escapes `\`, `%`, `_`)
- **`numericToString` parser util:** in `packages/node/src/parsers/utils.ts` — safe Hasura `numeric` scalar handling (codegen types as string)
- **`formatTokenAmount` BigInt arithmetic:** `apps/test/src/lib/utils.ts` — avoids Number precision loss on uint256 values (bigintFixed, bigintCompact helpers)
- **Extracted domain card components:** `DigitalAssetCard`, `ProfileCard` as separate files in `apps/test/src/components/` — pages import, not define
- **`FilterFieldConfig.options[]`:** renders shadcn Select for enum fields (tokenType filter) — prevents invalid free-text values

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-20
- **Activity:** Executed Phase 9.1 Plans 01–04 + post-plan E2E polish — full Digital Assets vertical slice complete
- **Outcome:** All 4 plans shipped: types + codegen → parsers + services + keys → hooks + server actions → playground page. Post-plan: SortNulls type, T[]|null arrays, escapeLike shared util, export \* barrel pattern, BigInt formatTokenAmount, extracted card components. PR #193 merged to `refactor/indexer-v2-react`.
- **Resume file:** None

### Context for Next Session

- **Phase 9.1 complete** — QUERY-02 delivered. PR #193 merged. `feat/phase-9.1-digital-assets` branch archived.
- **Next step:** Execute Phase 9.2 (NFTs) — follow the identical 4-plan vertical-slice pattern
- **Branch protocol:** Fetch + pull `refactor/indexer-v2-react`, then `git checkout -b feat/phase-9.2-nfts`
- **Pattern reference (from 9.1):**
  - `SortNulls` type + `orderDir()` — wire through NFT sort schema and service
  - `T[] | null` for all array fields — null = not fetched, [] = empty
  - `escapeLike` from `packages/node/src/services/utils.ts` — apply to all string filters
  - `numericToString` from `packages/node/src/parsers/utils.ts` — for Hasura `numeric` scalars
  - `export *` in all package index.ts files
  - Extract `NftCard` component to `apps/test/src/components/nft-card.tsx`
  - `FilterFieldConfig.options[]` for enum filters (tokenIdFormat, etc.)

---

_Last updated: 2026-02-20 — completed 09.1-04-PLAN.md (digital-assets-playground-e2e), Phase 9.1 complete, PR #193 merged_
