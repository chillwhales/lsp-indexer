# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 3.1 complete — Improve Debug Logging Strategy. Next: Phase 3.2 (Queue-Based Worker Pool)

## Current Position

- **Phase:** 3.1 of 7 — Improve Debug Logging Strategy (INSERTED)
- **Plan:** 4 of 4 in current phase
- **Status:** Phase complete (ALL gap closures addressed)
- **Last activity:** 2026-02-11 — Completed 03.1-04-PLAN.md (final code quality fixes)
- **Progress:** █████████░ 25/29 requirements complete (phases 1-4, 3.1 done; 3.2/5 remain)

## Phase Overview

| Phase | Name                              | Status       | Requirements |
| ----- | --------------------------------- | ------------ | :----------: |
| 1     | Handler Migration                 | **Complete** |     5/5      |
| 2     | New Handlers & Structured Logging | **Complete** |     5/5      |
| 3     | Metadata Fetch Handlers           | **Complete** |     5/5      |
| 3.1   | Improve Debug Logging Strategy    | **Complete** |     4/4      |
| 3.2   | Queue-Based Worker Pool           | **Next**     |     0/4      |
| 4     | Integration & Wiring              | **Complete** |     4/4      |
| 5     | Deployment & Validation           | Upcoming     |     0/2      |

## Performance Metrics

- **Plans completed:** 20
- **Plans failed:** 0
- **Phases completed:** 5 (of 7 total; 2 phases inserted 2026-02-11)
- **Requirements delivered:** 25/29 (HMIG-01–05, HNDL-01–03, INFR-01–02, META-01–05, LOG-01–04, INTG-01–04)

## Accumulated Context

### Roadmap Evolution

**2026-02-11:** Inserted Phase 3.1 and Phase 3.2 after Phase 3 (urgent work discovered during PR #152)

- **Phase 3.1 — Improve Debug Logging Strategy:** Create logger utility with configurable log levels and component-specific debug flags
  - **Rationale:** PR #152 debugging took too long because worker operations were invisible without code modifications
  - **Impact:** Future debugging will be much faster with proper logging infrastructure
- **Phase 3.2 — Queue-Based Worker Pool Optimization:** Refactor MetadataWorkerPool from batch-wait to queue-based architecture

  - **Rationale:** Batch-wait pattern leaves workers idle during result processing (~35s for 1,000 URLs)
  - **Impact:** Queue-based approach keeps workers continuously busy (~17s expected, ~2x throughput)

- **Numbering strategy:** Decimal phases (3.1, 3.2) preserve logical sequence without renumbering phases 4-5
- **Dependencies:** Phase 3.2 depends on Phase 3.1 (logging helps validate queue behavior)

### Key Decisions

| Decision                                                            | Rationale                                                                  | Phase   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 5-phase structure derived from requirement dependencies             | HMIG → HNDL+INFR → META → INTG → DEPL follows natural dependency chain     | Roadmap |
| Logging parallelized with new handlers in Phase 2                   | INFR has no dependency on HNDL, enables concurrent work                    | Roadmap |
| Metadata separated from simple handlers                             | External I/O + critical pitfalls (spin-wait) warrant isolation             | Roadmap |
| queueDelete() separate from removeEntity()                          | Distinguish DB-level deletion from in-memory bag removal                   | 01-01   |
| postVerification as opt-in boolean flag                             | Keeps all handlers as one type, existing handlers unaffected               | 01-01   |
| topologicalSort on every registerEntityHandler()                    | Supports test scenarios with manual registration                           | 01-01   |
| Decimals uses postVerification: true for Step 5.5                   | Needs verified DA entities, must run after verification                    | 01-03   |
| FormattedTokenId mutates NFTs in-place in BatchContext              | Already in bag from NFT handler, avoids duplicate entries                  | 01-03   |
| Unknown format returns null + warning (not raw tokenId)             | V2 change from V1 — explicit null signals unknown format                   | 01-03   |
| OwnedAsset FK set directly on OwnedToken (not via enrichment queue) | OwnedAsset is handler-created, not a verified core entity (UP/DA/NFT)      | 01-02   |
| Dual-trigger handlers read ALL bags per invocation                  | Ensures consistency regardless of trigger order                            | 01-02   |
| JSDoc 'Port from v1' annotated with deletion note, not removed      | Preserves provenance trail for future developers                           | 01-04   |
| vitest @/\* alias maps to lib/ with CJS Module hook                 | src/ directory incomplete, compiled JS in lib/ has @/\* require() calls    | 02-02   |
| Mock BatchContext pattern for handler unit tests                    | Reusable test pattern: seed entity bags, verify mock calls                 | 02-02   |
| Dual-output logging: Subsquid Logger.child() + pino                 | Subsquid controls stdout/stderr; pino adds independent file rotation       | 02-01   |
| LOG_LEVEL env var overrides NODE_ENV default                        | Explicit control over log verbosity in any environment                     | 02-01   |
| Type assertions for entity FK null vs undefined                     | TypeORM models type FKs without null but compiled JS sets null             | 02-03   |
| vi.mock for mergeEntitiesFromBatchAndDb in handler tests            | Isolate handler logic from DB dependencies in unit tests                   | 02-03   |
| Step loggers created once per pipeline section                      | createStepLogger outside loops avoids per-iteration overhead               | 02-04   |
| Handler log calls use step+handler dual fields                      | Enables filtering by pipeline step and specific handler name               | 02-04   |
| import type for @lukso contracts in V2                              | Node10 resolution + no strictNullChecks requires type-only imports         | 03-01   |
| EntityConstructor for entity updates in fetch utility               | Preserves TypeORM decorators; plain object spread loses metadata           | 03-01   |
| LSP4 icons mapped without isFileImage filter                        | V1 maps ALL icon array items directly, V2 must match exactly               | 03-03   |
| LSP4 Category always created even when value undefined              | V1 behavior creates entity with value: undefined                           | 03-03   |
| LSP29 AccessControlCondition excluded from SubEntityDescriptors     | FK points to Encryption not Asset; cleared via cascade                     | 03-02   |
| LSP29 entityUpdates returns version/contentId/revision/createdAt    | Parent entity fields updated on successful parse (matching V1)             | 03-02   |
| LSP3 profile images as flat arrays                                  | Unlike LSP4 nested arrays, LSP3 JSON schema uses flat arrays               | 03-02   |
| Processor defaults to LUKSO mainnet RPC and Subsquid archive        | Environment-based configuration for RPC_ENDPOINT and ARCHIVE_URL           | 04-01   |
| Bootstrap module with createRegistry() function                     | Structured logging during discovery, fail-fast validation                  | 04-02   |
| Registry discovery via \_\_dirname-resolved paths                   | Enables runtime discovery of compiled .plugin.js and .handler.js files     | 04-02   |
| MetadataWorkerPool pool size configurable via env var               | METADATA_WORKER_POOL_SIZE defaults to 4, overrideable at runtime           | 04-03   |
| createPipelineConfig() factory pattern                              | Assembles all pipeline dependencies in one function                        | 04-03   |
| BOOTSTRAP added to PipelineStep union                               | Enables structured logging during application boot phase                   | 04-03   |
| Block fixtures from LUKSO mainnet blocks 5.2M-5.3M                  | Real blockchain data for deterministic integration tests                   | 04-04   |
| Fixtures match Subsquid Context.blocks structure                    | Header + logs array with all required fields (address, topics, data)       | 04-04   |
| Mock store pattern for pipeline integration testing                 | Tracks inserted/upserted/removed entities without database dependency      | 04-05   |
| Integration tests validate handler execution order                  | Tests verify V1 dependency graph preserved (NFT before FormattedTokenId)   | 04-05   |
| createComponentLogger uses Logger.child() for component field       | Automatic component field injection for post-hoc filtering with jq/grep    | 03.1-01 |
| DEBUG_COMPONENTS documented for advisory filtering                  | Post-hoc filtering only; runtime filtering deferred to future optimization | 03.1-01 |
| All debug logs use isLevelEnabled check                             | Zero overhead when debug logging is disabled                               | 03.1-01 |
| createMockLogger() factory for test mocks                           | Consolidates type assertions to factory instead of per-call-site           | 03.1-03 |
| Date.now() calculations inside debug guards                         | Zero performance overhead when LOG_LEVEL=info (production)                 | 03.1-03 |
| If/else pattern for debug-enabled vs production paths               | Handlers duplicate minimal code to avoid debug overhead                    | 03.1-03 |
| MockLogger interface with explicit vi.fn() types                    | Zero type assertions in test code - TypeScript validates mock structure    | 03.1-04 |
| Check base logger level before creating component logger            | Logger only created when debug enabled (minimal variable scope)            | 03.1-04 |

### Discovered Todos

- decimals.handler.ts and formattedTokenId.handler.ts need logging updates when Phase 1 creates their TypeScript sources (4 JSON.stringify calls in compiled JS)

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-11
- **Activity:** Executed 03.1-04-PLAN.md — Final code quality fixes (gap closure)
- **Outcome:** Eliminated ALL remaining type assertions via MockLogger interface with explicit vi.fn() types (zero `as unknown as` in test file). Moved logger creation inside debug blocks for all 3 fetch handlers (logger only created when debug enabled, minimal variable scope). Phase 3.1 fully complete with ALL gap closures addressed (3 min execution).
- **Next Step:** Phase 3.2 (Queue-Based Worker Pool Optimization)

### Context for Next Session

- **Phase 3.1 complete (ALL gap closures addressed):** Debug logging infrastructure fully functional with code quality and performance optimizations
  - Plan 01: createComponentLogger helper, worker pool instrumentation, handler debug logging
  - Plan 02: Import wiring fixes — all 5 files now correctly import createComponentLogger/getFileLogger
  - Plan 03: Code quality improvements — eliminated type assertions in handlers, zero-overhead debug logging
  - Plan 04: Final fixes — zero type assertions in tests, logger minimal scope
  - User can set LOG_LEVEL=debug and see component-specific logs with zero ReferenceErrors
  - Post-hoc filtering enabled: `cat logs/*.log | jq 'select(.component == "worker_pool")'`
  - All logging uses isLevelEnabled check for zero overhead when disabled
  - Production (LOG_LEVEL=info) has no Date.now() overhead from debug instrumentation
  - Zero type assertions anywhere (proper TypeScript interfaces used)
  - Logger only created when debug enabled (no wasted object creation)
- **Next phase:** Phase 3.2 (Queue-Based Worker Pool Optimization) - run `/gsd-plan-phase 3.2`
  - Refactor MetadataWorkerPool from batch-wait to queue-based architecture
  - Keep N workers busy with X requests each for ~2x throughput
  - Debug logging from Phase 3.1 will help validate queue behavior
- **Planning documents available:**
  - `IMPROVEMENTS_ROADMAP.md` - Detailed specs for Phase 3.2

---

_Last updated: 2026-02-11_
