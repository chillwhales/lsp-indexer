# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 7 (Package Foundation)

## Current Position

- **Phase:** 7 — Package Foundation
- **Plan:** Not started (awaiting phase planning)
- **Status:** Roadmap complete, ready for phase planning
- **Last activity:** 2026-02-16 — Roadmap created for v1.1
- **Progress:** ░░░░░░░░░░ 0%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                                 | Requirements | Status  |
| ----- | ------------------------------------ | :----------: | ------- |
| 7     | Package Foundation                   |      7       | Pending |
| 8     | First Vertical Slice (Profiles)      |      3       | Pending |
| 9     | Remaining Query Domains & Pagination |      11      | Pending |
| 10    | Subscriptions                        |      3       | Pending |
| 11    | Server Actions & Publish Readiness   |      4       | Pending |

**Total:** 0/28 requirements delivered

## Performance Metrics

- **Plans completed:** 36 (v1.0)
- **Plans failed:** 0
- **Phases completed:** 11 (v1.0)
- **Requirements delivered:** 45/45 (v1.0), 0/28 (v1.1)

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

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-16
- **Activity:** v1.1 roadmap creation — 28 requirements mapped to 5 phases (7–11)
- **Outcome:** ROADMAP.md written, STATE.md updated, REQUIREMENTS.md traceability updated
- **Resume file:** N/A

### Context for Next Session

- **Roadmap complete** — 28 requirements across 5 phases (7–11)
- **Next step:** Execute Phase 7 plans (07-01, 07-02)
- **Phase 7 scope:** 7 FOUND-\* requirements — package scaffold, codegen, build, provider, error handling, entry points, Next.js test app
- **Critical pitfalls to address in Phase 7:** C1 (server/client leak), C2 (broken exports), C3 (missing "use client"), C4 (QueryClient conflicts), C5 (type exposure)
- **Research confidence:** HIGH across all dimensions — no spikes needed for Phase 7
- **Reference implementation:** `chillwhales/marketplace` packages/graphql and apps/web/src/hooks
- **Schema source:** `packages/typeorm/schema.graphql` → Hasura → codegen
- **⚠️ BRANCHING:** Before executing ANY plan, fetch latest `refactor/indexer-v2-react` and create a new feature branch. PR back to `refactor/indexer-v2-react`. See PROJECT.md for full protocol.

---

_Last updated: 2026-02-16_
