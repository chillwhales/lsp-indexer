# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 8 Complete, ready for Phase 9

## Current Position

- **Phase:** 8 of 11 (First Vertical Slice — Universal Profiles) ✅ COMPLETE
- **Plan:** 4 of 4
- **Status:** Phase complete
- **Last activity:** 2026-02-19 — Completed 08-04-PLAN.md (all 4 plans done)
- **Progress:** ████████░░ 80%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                                 | Requirements | Status   |
| ----- | ------------------------------------ | :----------: | -------- |
| 7     | Package Foundation                   |     7/7      | Complete |
| 8     | First Vertical Slice (Profiles)      |     3/3      | Complete |
| 9     | Remaining Query Domains & Pagination |      11      | Pending  |
| 10    | Subscriptions                        |      3       | Pending  |
| 11    | Server Actions & Publish Readiness   |      4       | Pending  |

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

- React hooks package lives in `packages/react` within lsp-indexer monorepo
- Two consumption patterns: client-side (TanStack Query) and server-side (next-safe-action)
- Three consumption patterns: queries (TanStack Query), subscriptions (graphql-ws), server actions (next-safe-action)
- GraphQL codegen from Hasura schema, types committed to repo
- **Branch workflow: ALL v1.1 work merges via PRs to `refactor/indexer-v2-react`** — see PROJECT.md "Branching & PR Workflow" for full protocol
- Reference: `chillwhales/marketplace` graphql package and web hooks (being standardized)
- Vertical-slice approach: build Universal Profiles end-to-end first, then replicate across 10 domains
- Minimal runtime deps — only `graphql-ws` for subscriptions; typed fetch wrapper for queries (zero query deps)
- Multiple entry points: `@lsp-indexer/react` (client), `@lsp-indexer/react/server`, `@lsp-indexer/react/types`
- Parser layer transforms Hasura snake_case → clean camelCase types
- `graphql-ws` for WebSocket subscriptions (Hasura supports natively)
- `graphql` is devDependency only (codegen build-time, not shipped)
- Phase numbering continues from v1.0: Phases 7–11
- Local schema.graphql with scalar definitions used for codegen fallback (Subsquid schema not directly parseable)
- Exports map uses split import/require conditions with separate .d.ts/.d.cts types
- typesVersions used for node10 resolution fallback
- treeshake disabled on tsup entries to preserve "use client" banner
- React 19 removes global JSX namespace — use React.ReactNode return types in components
- outputFileTracingRoot needed in next.config.ts for monorepo workspace root detection
- **UI: Always use shadcn/ui components over custom components** — Tailwind CSS v4 + shadcn/ui (new-york style) is the standard for all UI in apps/test and future consumer apps. No inline styles, no custom components when a shadcn equivalent exists.
- Next.js 16 for test app (Turbopack default, React 19.2 canary features)
- Local schema.graphql extended with full Hasura-style type stubs (bool_exp, order_by, aggregates) for CI/build codegen fallback
- All image types (avatar, profileImage, backgroundImage) share ProfileImage interface with nullable width/height
- Structural interface for image parsing (avoids codegen \_\_typename incompatibility between profile_image and background_image)
- tokenOwned filter branches into owned_tokens (with tokenId) vs owned_assets (without tokenId)
- Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
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
- **Activity:** Completed 08-04-PLAN.md — DRY refactor of playground page, all schema alignment fixes committed
- **Outcome:** Phase 8 fully complete. 3 commits for plan 08-04 (playground page + schema fixes + DRY refactor). SUMMARY.md written and self-checked.
- **Resume file:** None

### Context for Next Session

- **Phase 8 complete** — all 4 plans done, all 3 requirements delivered (QUERY-01, DX-01, DX-02)
- **Next step:** Phase 9 planning and execution (Remaining Query Domains & Pagination)
- **PR:** #183 open on `feat/react-profile-playground` → `refactor/indexer-v2-react` — needs push with latest commits
- **Key assets for Phase 9:**
  - Validated vertical-slice pattern: types → documents → codegen → parsers → services → keys → hooks → entry points
  - Shared playground components: FilterFieldsRow, SortControls, ResultsList<T> — ready for 10+ domain pages
  - Pattern: define `FilterFieldConfig[]`, `SortOption[]`, `buildDomainFilter()`, `DomainCard` → plug into shared components
- **Build validated:** Both `packages/react` and `apps/test` build with zero errors

---

_Last updated: 2026-02-19_
