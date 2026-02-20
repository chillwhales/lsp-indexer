# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 9 restructured into per-domain sub-phases (9.1–9.9)

## Current Position

- **Phase:** 9 of 11 (Remaining Query Domains — 9 sub-phases)
- **Sub-phase:** 9.1 (Digital Assets) — not yet started
- **Status:** Phase 9 restructured from monolithic 11-plan phase into 9 independent sub-phases
- **Last activity:** 2026-02-19 — Closed PRs #187–#190, restructured Phase 9 into sub-phases 9.1–9.9
- **Progress:** ████░░░░░░ 40% (10/28 requirements)

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
| 9.1   | Digital Assets                     |      1       | Pending  |
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

**Total:** 10/28 requirements delivered (FOUND-01–07, QUERY-01, DX-01, DX-02)

## Performance Metrics

- **Plans completed:** 42 (36 v1.0 + 6 v1.1)
- **Plans failed:** 0
- **Phases completed:** 13 (11 v1.0 + 2 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 10/28 (v1.1)

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
- **Activity:** Restructured Phase 9 into per-domain sub-phases
- **Outcome:** Closed PRs #187–#190 (timeline-based splits lacked domain granularity). Split monolithic Phase 9 (11 plans) into 9 independent sub-phases (9.1–9.9), each with 4 plans mirroring Phase 8's vertical-slice pattern. Updated ROADMAP and STATE.
- **Resume file:** None

### Context for Next Session

- **Phase 8 complete** — all 4 plans done, all 3 requirements delivered (QUERY-01, DX-01, DX-02)
- **Phase 9 restructured** — 9 sub-phases (9.1 Digital Assets → 9.9 Universal Receiver Events), each independent, each with own branch + PR
- **Existing code on `feat/phase-9-query-domains`** — all 9 domains implemented but needs per-domain review; code can be used as reference for clean per-domain branches
- **Codegen fix committed** — 4 document files migrated from manual TypedDocumentString to `graphql()` tag (on `feat/phase-9-part-1-codegen-creators-datachanged` branch, commit `16bf104`)
- **Next step:** Plan and execute Phase 9.1 (Digital Assets) — first sub-phase, own branch + PR
- **Key assets:**
  - Validated vertical-slice pattern: types → documents → codegen → parsers → services → keys → hooks → actions → playground
  - Shared playground components: FilterFieldsRow, SortControls, ResultsList<T> — ready for all domain pages
  - Developer workflow checklist documented in PROJECT.md "Adding a New Domain"
  - 4-package structure: types in `@lsp-indexer/types`, core in `@lsp-indexer/node`, hooks in `@lsp-indexer/react` + `@lsp-indexer/next`
- **Build validated:** All 4 packages + test app build with zero errors on epic branch

---

_Last updated: 2026-02-19 — restructured Phase 9 into sub-phases 9.1–9.9_
