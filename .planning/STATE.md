# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 7 (Package Foundation)

## Current Position

- **Phase:** 7 of 11 (Package Foundation)
- **Plan:** 1 of 2
- **Status:** In progress
- **Last activity:** 2026-02-17 — Completed 07-01-PLAN.md
- **Progress:** █░░░░░░░░░ 10%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                                 | Requirements | Status      |
| ----- | ------------------------------------ | :----------: | ----------- |
| 7     | Package Foundation                   |      7       | In Progress |
| 8     | First Vertical Slice (Profiles)      |      3       | Pending     |
| 9     | Remaining Query Domains & Pagination |      11      | Pending     |
| 10    | Subscriptions                        |      3       | Pending     |
| 11    | Server Actions & Publish Readiness   |      4       | Pending     |

**Total:** 0/28 requirements delivered (FOUND-01 through FOUND-06 partially addressed by 07-01, fully validated after 07-02)

## Performance Metrics

- **Plans completed:** 37 (36 v1.0 + 1 v1.1)
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
- Local schema.graphql with scalar definitions used for codegen fallback (Subsquid schema not directly parseable)
- Exports map uses split import/require conditions with separate .d.ts/.d.cts types
- typesVersions used for node10 resolution fallback
- treeshake disabled on tsup entries to preserve "use client" banner

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-17
- **Activity:** Executed 07-01-PLAN.md — React package scaffold, codegen, error handling, client utilities
- **Outcome:** 3 tasks completed, 3 commits, SUMMARY.md written. Package builds with zero publint/arethetypeswrong errors.
- **Resume file:** None

### Context for Next Session

- **07-01 complete** — packages/react is buildable with all entry points validated
- **Next step:** Execute 07-02-PLAN.md (Next.js test app + end-to-end validation)
- **Branch:** `feat/react-package-scaffold` — needs PR to `refactor/indexer-v2-react` before starting 07-02
- **Key files delivered:** packages/react/{package.json, tsup.config.ts, codegen.ts, src/errors/, src/client/, src/graphql/}
- **Note:** Full Hasura types require introspection from live endpoint. Local schema provides base scalars only.
- **BRANCHING:** Before executing 07-02, merge/PR feat/react-package-scaffold, then create new branch from refactor/indexer-v2-react.

---

_Last updated: 2026-02-17_
