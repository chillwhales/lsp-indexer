# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 1 — Handler Migration (refactor existing handlers to EntityHandler interface, build FormattedTokenId, delete legacy code)

## Current Position

- **Phase:** 1 of 5 — Handler Migration
- **Plan:** 1 of 4 in current phase
- **Status:** In progress
- **Last activity:** 2026-02-06 — Completed 01-01-PLAN.md

Progress: ██░░░░░░░░ 1/4 phase plans (0/21 requirements)

## Phase Overview

| Phase | Name                              | Status      | Requirements |
| ----- | --------------------------------- | ----------- | :----------: |
| 1     | Handler Migration                 | **Current** |     0/5      |
| 2     | New Handlers & Structured Logging | Upcoming    |     0/5      |
| 3     | Metadata Fetch Handlers           | Upcoming    |     0/5      |
| 4     | Integration & Wiring              | Upcoming    |     0/4      |
| 5     | Deployment & Validation           | Upcoming    |     0/2      |

## Performance Metrics

- **Plans completed:** 1
- **Plans failed:** 0
- **Phases completed:** 0
- **Requirements delivered:** 0/21

## Accumulated Context

### Key Decisions

| Decision                                                | Rationale                                                              | Phase   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain | Roadmap |
| Logging parallelized with new handlers in Phase 2       | INFR has no dependency on HNDL, enables concurrent work                | Roadmap |
| Metadata separated from simple handlers                 | External I/O + critical pitfalls (spin-wait) warrant isolation         | Roadmap |
| queueDelete() separate from removeEntity()              | Distinguish DB-level deletion from in-memory bag removal               | 01-01   |
| postVerification as opt-in boolean flag                 | Keeps all handlers as one type, existing handlers unaffected           | 01-01   |
| topologicalSort on every registerEntityHandler()        | Supports test scenarios with manual registration                       | 01-01   |

### Discovered Todos

_None yet — populated during implementation._

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-06
- **Activity:** Executed 01-01-PLAN.md — infrastructure changes for handler migration
- **Outcome:** Async handler support, delete queue, Step 5.5 hook, topological ordering all working
- **Next Step:** Execute 01-02-PLAN.md (totalSupply + ownedAssets handlers)

### Context for Next Session

- All planning artifacts are in `.planning/`
- Phase 1 infrastructure complete: async handlers, delete queue, postVerification, dependsOn, topological sort
- 01-02 depends on this plan's infrastructure for handler implementations
- 15 existing handlers compile without changes — all new features are opt-in

---

_Last updated: 2026-02-06_
