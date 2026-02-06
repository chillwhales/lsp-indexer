# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 2 — New Handlers & Structured Logging (Follower handler, LSP6 verification, structured logging)

## Current Position

- **Phase:** 2 of 5 — New Handlers & Structured Logging
- **Plan:** 2 of 4 in current phase
- **Status:** In progress
- **Last activity:** 2026-02-06 — Completed 02-02-PLAN.md
- **Progress:** █░░░░░░░░░ 1/4 phase plans complete

## Phase Overview

| Phase | Name                              | Status          | Requirements |
| ----- | --------------------------------- | --------------- | :----------: |
| 1     | Handler Migration                 | Not Started     |     0/5      |
| 2     | New Handlers & Structured Logging | **In Progress** |     2/5      |
| 3     | Metadata Fetch Handlers           | Upcoming        |     0/5      |
| 4     | Integration & Wiring              | Upcoming        |     0/4      |
| 5     | Deployment & Validation           | Upcoming        |     0/2      |

## Performance Metrics

- **Plans completed:** 1
- **Plans failed:** 0
- **Phases completed:** 0
- **Requirements delivered:** 2/21 (HNDL-01, HNDL-02)

## Accumulated Context

### Key Decisions

| Decision                                                | Rationale                                                               | Phase   |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain  | Roadmap |
| Logging parallelized with new handlers in Phase 2       | INFR has no dependency on HNDL, enables concurrent work                 | Roadmap |
| Metadata separated from simple handlers                 | External I/O + critical pitfalls (spin-wait) warrant isolation          | Roadmap |
| vitest @/\* alias maps to lib/ with CJS Module hook     | src/ directory incomplete, compiled JS in lib/ has @/\* require() calls | 02-02   |
| Mock BatchContext pattern for handler unit tests        | Reusable test pattern: seed entity bags, verify mock calls              | 02-02   |

### Discovered Todos

_None yet — populated during implementation._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-06
- **Activity:** Executed 02-02-PLAN.md — Follower handler + EventPlugin TS sources + unit tests
- **Outcome:** Follower EntityHandler, Follow/Unfollow EventPlugin TS sources, 8 unit tests all passing
- **Next Step:** Execute 02-03-PLAN.md (LSP6Controllers handler TS port + verification tests)

### Context for Next Session

- Follower handler at `packages/indexer-v2/src/handlers/follower.handler.ts`
- Follow/Unfollow EventPlugins at `packages/indexer-v2/src/plugins/events/`
- vitest infrastructure ready at `packages/indexer-v2/vitest.config.ts` + `vitest.setup.ts`
- Mock BatchContext pattern in test file reusable for LSP6 handler tests
- Remaining plans: 02-03 (LSP6), 02-04 (structured logging replacement)

---

_Last updated: 2026-02-06_
