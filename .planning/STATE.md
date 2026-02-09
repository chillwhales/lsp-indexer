# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 3 complete — Metadata Fetch Handlers done. Ready for Phase 4 (Integration & Wiring).

## Current Position

- **Phase:** 3 of 5 — Metadata Fetch Handlers
- **Plan:** 4 of 4 in current phase (all complete)
- **Status:** Phase complete
- **Last activity:** 2026-02-09 — Completed 03-04-PLAN.md
- **Progress:** ███████░░░ 15/21 requirements complete

## Phase Overview

| Phase | Name                              | Status       | Requirements |
| ----- | --------------------------------- | ------------ | :----------: |
| 1     | Handler Migration                 | **Complete** |     5/5      |
| 2     | New Handlers & Structured Logging | **Complete** |     5/5      |
| 3     | Metadata Fetch Handlers           | **Complete** |     5/5      |
| 4     | Integration & Wiring              | Upcoming     |     0/4      |
| 5     | Deployment & Validation           | Upcoming     |     0/2      |

## Performance Metrics

- **Plans completed:** 12
- **Plans failed:** 0
- **Phases completed:** 3
- **Requirements delivered:** 15/21 (HMIG-01–05, HNDL-01–03, INFR-01–02, META-01–05)

## Accumulated Context

### Key Decisions

| Decision                                                            | Rationale                                                               | Phase   |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies             | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain  | Roadmap |
| Logging parallelized with new handlers in Phase 2                   | INFR has no dependency on HNDL, enables concurrent work                 | Roadmap |
| Metadata separated from simple handlers                             | External I/O + critical pitfalls (spin-wait) warrant isolation          | Roadmap |
| queueDelete() separate from removeEntity()                          | Distinguish DB-level deletion from in-memory bag removal                | 01-01   |
| postVerification as opt-in boolean flag                             | Keeps all handlers as one type, existing handlers unaffected            | 01-01   |
| topologicalSort on every registerEntityHandler()                    | Supports test scenarios with manual registration                        | 01-01   |
| Decimals uses postVerification: true for Step 5.5                   | Needs verified DA entities, must run after verification                 | 01-03   |
| FormattedTokenId mutates NFTs in-place in BatchContext              | Already in bag from NFT handler, avoids duplicate entries               | 01-03   |
| Unknown format returns null + warning (not raw tokenId)             | V2 change from V1 — explicit null signals unknown format                | 01-03   |
| OwnedAsset FK set directly on OwnedToken (not via enrichment queue) | OwnedAsset is handler-created, not a verified core entity (UP/DA/NFT)   | 01-02   |
| Dual-trigger handlers read ALL bags per invocation                  | Ensures consistency regardless of trigger order                         | 01-02   |
| JSDoc 'Port from v1' annotated with deletion note, not removed      | Preserves provenance trail for future developers                        | 01-04   |
| vitest @/\* alias maps to lib/ with CJS Module hook                 | src/ directory incomplete, compiled JS in lib/ has @/\* require() calls | 02-02   |
| Mock BatchContext pattern for handler unit tests                    | Reusable test pattern: seed entity bags, verify mock calls              | 02-02   |
| Dual-output logging: Subsquid Logger.child() + pino                 | Subsquid controls stdout/stderr; pino adds independent file rotation    | 02-01   |
| LOG_LEVEL env var overrides NODE_ENV default                        | Explicit control over log verbosity in any environment                  | 02-01   |
| Type assertions for entity FK null vs undefined                     | TypeORM models type FKs without null but compiled JS sets null          | 02-03   |
| vi.mock for mergeEntitiesFromBatchAndDb in handler tests            | Isolate handler logic from DB dependencies in unit tests                | 02-03   |
| Step loggers created once per pipeline section                      | createStepLogger outside loops avoids per-iteration overhead            | 02-04   |
| Handler log calls use step+handler dual fields                      | Enables filtering by pipeline step and specific handler name            | 02-04   |
| import type for @lukso contracts in V2                              | Node10 resolution + no strictNullChecks requires type-only imports      | 03-01   |
| EntityConstructor for entity updates in fetch utility               | Preserves TypeORM decorators; plain object spread loses metadata        | 03-01   |
| LSP4 icons mapped without isFileImage filter                        | V1 maps ALL icon array items directly, V2 must match exactly            | 03-03   |
| LSP4 Category always created even when value undefined              | V1 behavior creates entity with value: undefined                        | 03-03   |
| LSP29 AccessControlCondition excluded from SubEntityDescriptors     | FK points to Encryption not Asset; cleared via cascade                  | 03-02   |
| LSP29 entityUpdates returns version/contentId/revision/createdAt    | Parent entity fields updated on successful parse (matching V1)          | 03-02   |
| LSP3 profile images as flat arrays                                  | Unlike LSP4 nested arrays, LSP3 JSON schema uses flat arrays            | 03-02   |
| Test through shared utility (integration-style) for fetch handlers  | Validates full flow handler → utility → worker pool → parsing           | 03-04   |

### Discovered Todos

- decimals.handler.ts and formattedTokenId.handler.ts need logging updates when Phase 1 creates their TypeScript sources (4 JSON.stringify calls in compiled JS)

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-09
- **Activity:** Executed 03-04-PLAN.md — Unit tests for all three metadata fetch handlers (58 tests total)
- **Outcome:** All tests pass, build compiles, Phase 3 complete (all 5 META requirements verified)
- **Next Step:** Phase 4 — Integration & Wiring

### Context for Next Session

- All EventPlugins exist (11 files in `packages/indexer-v2/src/plugins/events/`)
- All EntityHandlers exist (handlers in `packages/indexer-v2/src/handlers/`)
- Phase 4 will wire everything into the processor, configure subscriptions, and run integration tests
- Pre-existing test failures in pipeline.test.ts (18) and batchContext.test.ts (1) remain — not caused by our changes

---

_Last updated: 2026-02-09_
