# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 2 — New Handlers & Structured Logging (Follower handler, LSP6 verification, structured logging)

## Current Position

- **Phase:** 2 of 5 — New Handlers & Structured Logging
- **Plan:** 2 of 4 in current phase (02-01 and 02-02 complete)
- **Status:** In progress
- **Last activity:** 2026-02-06 — Completed 02-01-PLAN.md
- **Progress:** ██░░░░░░░░ 2/4 phase plans complete

## Phase Overview

| Phase | Name                              | Status          | Requirements |
| ----- | --------------------------------- | --------------- | :----------: |
| 1     | Handler Migration                 | Not Started     |     0/5      |
| 2     | New Handlers & Structured Logging | **In Progress** |     4/5      |
| 3     | Metadata Fetch Handlers           | Upcoming        |     0/5      |
| 4     | Integration & Wiring              | Upcoming        |     0/4      |
| 5     | Deployment & Validation           | Upcoming        |     0/2      |

## Performance Metrics

- **Plans completed:** 2
- **Plans failed:** 0
- **Phases completed:** 0
- **Requirements delivered:** 4/21 (HNDL-01, HNDL-02, INFR-01, INFR-02)

## Accumulated Context

### Key Decisions

| Decision                                                | Rationale                                                               | Phase   |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain  | Roadmap |
| Logging parallelized with new handlers in Phase 2       | INFR has no dependency on HNDL, enables concurrent work                 | Roadmap |
| Metadata separated from simple handlers                 | External I/O + critical pitfalls (spin-wait) warrant isolation          | Roadmap |
| vitest @/\* alias maps to lib/ with CJS Module hook     | src/ directory incomplete, compiled JS in lib/ has @/\* require() calls | 02-02   |
| Mock BatchContext pattern for handler unit tests        | Reusable test pattern: seed entity bags, verify mock calls              | 02-02   |
| Dual-output logging: Subsquid Logger.child() + pino     | Subsquid controls stdout/stderr; pino adds independent file rotation    | 02-01   |
| LOG_LEVEL env var overrides NODE_ENV default            | Explicit control over log verbosity in any environment                  | 02-01   |

### Discovered Todos

_None yet — populated during implementation._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-06
- **Activity:** Executed 02-01-PLAN.md — Structured logger module (pino + createStepLogger factory)
- **Outcome:** Logger factory with dual-output (Subsquid + pino), 11 unit tests passing
- **Next Step:** Execute 02-03-PLAN.md (LSP6Controllers handler TS port + verification tests)

### Context for Next Session

- Logger factory at `packages/indexer-v2/src/core/logger.ts`
- Follower handler at `packages/indexer-v2/src/handlers/follower.handler.ts`
- Follow/Unfollow EventPlugins at `packages/indexer-v2/src/plugins/events/`
- vitest infrastructure ready at `packages/indexer-v2/vitest.config.ts` + `vitest.setup.ts`
- Remaining plans: 02-03 (LSP6 verification), 02-04 (replace JSON.stringify logging)

---

_Last updated: 2026-02-06_
