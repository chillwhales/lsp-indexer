# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 9 in progress (Remaining Query Domains)

## Current Position

- **Phase:** 9 of 11 (Remaining Query Domains & Pagination)
- **Plan:** 7 of 11
- **Status:** In progress
- **Last activity:** 2026-02-19 — Completed 09-02-PLAN.md (Digital Assets domain)
- **Progress:** ████████░░ 84%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                                 | Requirements | Status                        |
| ----- | ------------------------------------ | :----------: | ----------------------------- |
| 7     | Package Foundation                   |     7/7      | Complete                      |
| 8     | First Vertical Slice (Profiles)      |     3/3      | Complete                      |
| 9     | Remaining Query Domains & Pagination |     3/11     | In Progress (4/11 plans done) |
| 10    | Subscriptions                        |      3       | Pending                       |
| 11    | Server Actions & Publish Readiness   |      4       | Pending                       |

**Total:** 13/28 requirements delivered (FOUND-01–07, QUERY-01, QUERY-02, QUERY-06, QUERY-07, DX-01, DX-02)

## Performance Metrics

- **Plans completed:** 46 (36 v1.0 + 10 v1.1)
- **Plans failed:** 0
- **Phases completed:** 13 (11 v1.0 + 2 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 13/28 (v1.1)

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

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-19
- **Activity:** Executed 09-02-PLAN.md — Digital Assets domain vertical slice
- **Outcome:** Built complete digital assets domain across all 4 packages + playground page. DigitalAsset type with name, symbol, tokenType, totalSupply, creatorCount, holderCount. Filters for name/symbol/tokenType/creatorAddress. Sort by name/symbol/holderCount/creatorCount. QUERY-02 delivered.
- **Resume file:** None

### Context for Next Session

- **Phase 9 plan 02 complete** — Digital Assets domain delivered
- **Next step:** Continue Wave 2 domain plans (remaining 09-XX plans)
- **Key assets:**
  - Digital assets demonstrate the LSP4 nested field parsing pattern (lsp4TokenName.value, lsp4TokenType.value, totalSupply.value)
  - holderCount from ownedTokens_aggregate, creatorCount from lsp4Creators_aggregate
  - Playground page at /digital-assets with 3 tabs and Client/Server toggle
- **Build validated:** All 4 packages build with zero errors, test app type-checks clean

---

_Last updated: 2026-02-19T16:18Z_
