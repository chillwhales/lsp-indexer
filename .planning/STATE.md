# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 2 complete — moving to Phase 1 (Handler Migration) or Phase 3 (Metadata Fetch Handlers)

## Current Position

- **Phase:** 2 of 5 — New Handlers & Structured Logging
- **Plan:** 4 of 4 in current phase (02-01, 02-02, 02-03, 02-04 complete)
- **Status:** Phase complete
- **Last activity:** 2026-02-06 — Completed 02-04-PLAN.md
- **Progress:** ████░░░░░░ 4/4 phase plans complete

## Phase Overview

| Phase | Name                              | Status       | Requirements |
| ----- | --------------------------------- | ------------ | :----------: |
| 1     | Handler Migration                 | Not Started  |     0/5      |
| 2     | New Handlers & Structured Logging | **Complete** |     5/5      |
| 3     | Metadata Fetch Handlers           | Upcoming     |     0/5      |
| 4     | Integration & Wiring              | Upcoming     |     0/4      |
| 5     | Deployment & Validation           | Upcoming     |     0/2      |

## Performance Metrics

- **Plans completed:** 4
- **Plans failed:** 0
- **Phases completed:** 1
- **Requirements delivered:** 5/21 (HNDL-01, HNDL-02, HNDL-03, INFR-01, INFR-02)

## Accumulated Context

### Key Decisions

| Decision                                                 | Rationale                                                               | Phase   |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies  | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain  | Roadmap |
| Logging parallelized with new handlers in Phase 2        | INFR has no dependency on HNDL, enables concurrent work                 | Roadmap |
| Metadata separated from simple handlers                  | External I/O + critical pitfalls (spin-wait) warrant isolation          | Roadmap |
| vitest @/\* alias maps to lib/ with CJS Module hook      | src/ directory incomplete, compiled JS in lib/ has @/\* require() calls | 02-02   |
| Mock BatchContext pattern for handler unit tests         | Reusable test pattern: seed entity bags, verify mock calls              | 02-02   |
| Dual-output logging: Subsquid Logger.child() + pino      | Subsquid controls stdout/stderr; pino adds independent file rotation    | 02-01   |
| LOG_LEVEL env var overrides NODE_ENV default             | Explicit control over log verbosity in any environment                  | 02-01   |
| Type assertions for entity FK null vs undefined          | TypeORM models type FKs without null but compiled JS sets null          | 02-03   |
| vi.mock for mergeEntitiesFromBatchAndDb in handler tests | Isolate handler logic from DB dependencies in unit tests                | 02-03   |
| Step loggers created once per pipeline section           | createStepLogger outside loops avoids per-iteration overhead            | 02-04   |
| Handler log calls use step+handler dual fields           | Enables filtering by pipeline step and specific handler name            | 02-04   |

### Discovered Todos

- decimals.handler.ts and formattedTokenId.handler.ts need logging updates when Phase 1 creates their TypeScript sources (4 JSON.stringify calls in compiled JS)

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-06
- **Activity:** Executed 02-04-PLAN.md — Replace JSON.stringify logging with structured attributes
- **Outcome:** All 13 JSON.stringify calls in TS sources replaced; pipeline.ts and verification.ts created
- **Next Step:** Phase 2 complete. Begin Phase 1 (Handler Migration) or Phase 3 (Metadata Fetch Handlers)

### Context for Next Session

- Pipeline TS source at `packages/indexer-v2/src/core/pipeline.ts`
- Verification TS source at `packages/indexer-v2/src/core/verification.ts`
- Logger factory at `packages/indexer-v2/src/core/logger.ts`
- Follower handler at `packages/indexer-v2/src/handlers/follower.handler.ts`
- LSP6Controllers handler at `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- Follow/Unfollow EventPlugins at `packages/indexer-v2/src/plugins/events/`
- vitest infrastructure ready at `packages/indexer-v2/vitest.config.ts` + `vitest.setup.ts`
- Phase 2 fully complete — all 4 plans executed

---

_Last updated: 2026-02-06_
