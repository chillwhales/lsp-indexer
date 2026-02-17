# State: LSP Indexer

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

**Current focus:** v1.1 React Hooks Package — Phase 8 (First Vertical Slice)

## Current Position

- **Phase:** 7 of 11 (Package Foundation)
- **Plan:** 2 of 2
- **Status:** Phase complete
- **Last activity:** 2026-02-17 — Completed 07-02-PLAN.md
- **Progress:** ██░░░░░░░░ 20%

## Milestone History

| Milestone | Phases | Plans | Requirements | Shipped    |
| --------- | ------ | ----- | ------------ | ---------- |
| v1.0      | 11     | 36    | 45/45        | 2026-02-16 |

Archives: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

## v1.1 Progress

| Phase | Name                                 | Requirements | Status   |
| ----- | ------------------------------------ | :----------: | -------- |
| 7     | Package Foundation                   |     7/7      | Complete |
| 8     | First Vertical Slice (Profiles)      |      3       | Pending  |
| 9     | Remaining Query Domains & Pagination |      11      | Pending  |
| 10    | Subscriptions                        |      3       | Pending  |
| 11    | Server Actions & Publish Readiness   |      4       | Pending  |

**Total:** 7/28 requirements delivered (FOUND-01 through FOUND-07 validated by 07-01 + 07-02)

## Performance Metrics

- **Plans completed:** 38 (36 v1.0 + 2 v1.1)
- **Plans failed:** 0
- **Phases completed:** 12 (11 v1.0 + 1 v1.1)
- **Requirements delivered:** 45/45 (v1.0), 7/28 (v1.1)

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

### Discovered Todos

_None currently._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-17
- **Activity:** Executed 07-02-PLAN.md — Next.js test app + end-to-end validation
- **Outcome:** 2 tasks completed, 2 commits, SUMMARY.md written. `next build` succeeds with zero errors, all 3 entry points validated.
- **Resume file:** None

### Context for Next Session

- **Phase 7 complete** — All 7 FOUND requirements delivered
- **Next step:** Phase 8 planning (First Vertical Slice — Universal Profiles)
- **Branch:** `feat/react-test-app` — needs PR to `refactor/indexer-v2-react`
- **Key files delivered:** apps/test/ (Next.js 16 App Router + shadcn/ui + Tailwind v4), pnpm-workspace.yaml (apps/\*)
- **Note:** Phase 8 requires live Hasura endpoint for codegen introspection to get full query/filter types. Test app has `.env.local.example` for setup.
- **Test app ready** to receive domain playground pages (profiles, assets, etc.)

---

_Last updated: 2026-02-17_
