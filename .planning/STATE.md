# State: LSP Indexer V2

## Project Reference

**Core Value:** The indexer must process every LUKSO blockchain event correctly and produce identical data to V1, so V2 can replace V1 in production without data loss or API regressions.

**Current Focus:** Phase 5 comparison tool revealed data gaps — inserting sub-phases 5.1 and 5.2 for gap closure

## Current Position

- **Phase:** 5.2 of 9 — LSP4 Base URI & Count Parity
- **Plan:** 2 of 3 in current phase
- **Status:** In progress
- **Last activity:** 2026-02-13 — Completed 05.2-02-PLAN.md (Orb handler mint detection defaults)
- **Progress:** █████████░ 33/38 requirements complete (phases 1-4, 3.1, 5, 5.1 done; 3.2/5.2 remain, 2/4 5.2 reqs done)

## Phase Overview

| Phase | Name                                | Status       | Requirements |
| ----- | ----------------------------------- | ------------ | :----------: |
| 1     | Handler Migration                   | **Complete** |     5/5      |
| 2     | New Handlers & Structured Logging   | **Complete** |     5/5      |
| 3     | Metadata Fetch Handlers             | **Complete** |     5/5      |
| 3.1   | Improve Debug Logging Strategy      | **Complete** |     4/4      |
| 3.2   | Queue-Based Worker Pool             | Deferred     |     0/4      |
| 4     | Integration & Wiring                | **Complete** |     4/4      |
| 5     | Deployment & Validation             | **Complete** |     2/2      |
| 5.1   | Pipeline Bug Fix & Missing Handlers | **Complete** |     5/5      |
| 5.2   | LSP4 Base URI & Count Parity        | In Progress  |     2/4      |

## Performance Metrics

- **Plans completed:** 27
- **Plans failed:** 0
- **Phases completed:** 7 (of 9 total; 4 phases inserted)
- **Requirements delivered:** 33/38 (HMIG-01–05, HNDL-01–03, INFR-01–02, META-01–05, LOG-01–04, INTG-01–04, DEPL-01–02, GAP-01–05, GAP-07, GAP-08, GAP-09)

## Accumulated Context

### Roadmap Evolution

**2026-02-12:** Inserted Phase 5.1 and Phase 5.2 after Phase 5 (gaps discovered via comparison tool)

- **Phase 5.1 — Pipeline Bug Fix & Missing Core Handlers:**
  - **Root cause:** Contract filter in `pipeline.ts:205` uses strict `!==` for address comparison — mixed-case vs lowercase addresses never match, silencing all events from LSP23 and LSP26 contracts (Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies)
  - **Missing handlers:** UniversalProfileOwner/DigitalAssetOwner (referenced as issue #105 in code comments), ChillClaimed/OrbsClaimed (never ported from V1)
  - **Impact:** Fixes 8 entity types with zero rows in V2
- **Phase 5.2 — LSP4 Base URI & Count Parity:**
  - **Root cause:** V1's `utils/lsp4MetadataBaseUri.ts` creates ~84K additional LSP4Metadata entities by combining `LSP8TokenMetadataBaseURI` with NFT tokenIds. V2 has no equivalent flow.
  - **Additional:** OwnedAsset V2 creates for ALL transfer participants (V1 filters to verified UPs only), LSP8ReferenceContract and Orb entity count gaps need investigation
  - **Impact:** Closes remaining count mismatches for production parity

**2026-02-11:** Inserted Phase 3.1 and Phase 3.2 after Phase 3 (urgent work discovered during PR #152)

- **Phase 3.1 — Improve Debug Logging Strategy:** Create logger utility with configurable log levels and component-specific debug flags
  - **Rationale:** PR #152 debugging took too long because worker operations were invisible without code modifications
  - **Impact:** Future debugging will be much faster with proper logging infrastructure
- **Phase 3.2 — Queue-Based Worker Pool Optimization:** Refactor MetadataWorkerPool from batch-wait to queue-based architecture

  - **Rationale:** Batch-wait pattern leaves workers idle during result processing (~35s for 1,000 URLs)
  - **Impact:** Queue-based approach keeps workers continuously busy (~17s expected, ~2x throughput)

- **Numbering strategy:** Decimal phases (3.1, 3.2, 5.1, 5.2) preserve logical sequence without renumbering
- **Dependencies:** Phase 5.2 depends on Phase 5.1 (core pipeline bug must be fixed first)

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
| Snake case conversion preserves LSP prefixes                        | LSP3ProfileImage → lsp3_profile_image (not lsp_3_profile_image)            | 05-01   |
| GraphQL client returns -1 for missing tables                        | Enables comparison tool to detect missing entity types without crashes     | 05-01   |
| Field introspection filters to scalar types only                    | Excludes object/array relations for row comparison with primitive values   | 05-01   |
| Field cache per table in GraphQL client                             | Avoids repeated introspection queries during sample comparisons            | 05-01   |
| Pipeline contract filter uses case-insensitive address comparison   | Subsquid delivers lowercase, constants use checksummed EIP-55 addresses    | 05.1-01 |
| Owner handlers use postVerification: true for Step 5.5              | Need verified UP/DA entities before creating owner entities                | 05.1-01 |
| Owner entity id = emitting address, address field = newOwner        | Matches V1 data model exactly for UniversalProfileOwner/DigitalAssetOwner  | 05.1-01 |
| ChillClaimed/OrbsClaimed two-phase pattern                          | Mint detection every batch + on-chain verification at isHead only          | 05.1-02 |
| ChillClaimed/OrbsClaimed batch size 500 with 1s rate limiting       | Matches V1 behavior exactly for production parity                          | 05.1-02 |
| CHILL uses getClaimedStatusFor, ORBS uses getChillwhaleClaimStatus  | Different reward contracts have different ABI function names               | 05.1-02 |
| OwnedAsset handler filters by triggeredBy parameter                 | Handler called twice per batch, dual-bag read caused 2x processing         | 05.2-01 |
| LSP8ReferenceContract marked as known V1 divergence                 | V1 switch fall-through bug creates phantom entities, not a V2 gap          | 05.2-01 |
| Orb handlers create mint-time defaults via LSP8Transfer             | OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral' on mint from zero    | 05.2-02 |
| Mint defaults overwritten by addEntity() when TokenIdDataChanged    | Map.set() semantics in batch bag, matches V1 behavior exactly              | 05.2-02 |

### Discovered Todos

- decimals.handler.ts and formattedTokenId.handler.ts need logging updates when Phase 1 creates their TypeScript sources (4 JSON.stringify calls in compiled JS)

### Blockers

_None currently._

## Session Continuity

### Last Session

- **Date:** 2026-02-13
- **Activity:** Completed Plan 05.2-02 (Orb handler mint detection defaults)
- **Outcome:** Added LSP8Transfer mint detection to orbLevel and orbFaction handlers. Both handlers now create default entities on Orb NFT mint (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral') matching V1 behavior. Dual-trigger handlers branch on triggeredBy parameter (LSP8Transfer vs TokenIdDataChanged). Mint defaults are overwritten when TokenIdDataChanged events arrive. GAP-09 complete.
- **Stopped at:** Completed 05.2-02-PLAN.md
- **Resume file:** None

### Context for Next Session

- **Phase 5 complete:** Comparison tool built and tested against live endpoints
  - Moved to standalone `packages/comparison-tool/` package (PR #159)
  - Supports v1-v2 and v2-v2 modes with tolerance percentage
  - Fixed snake_case conversion bug (LSP entities)
- **Phase 5.1 complete + MERGED:** Pipeline Bug Fix & Missing Core Handlers
  - Fixed case-sensitive address comparison in pipeline.ts (GAP-01)
  - Created UniversalProfileOwner + DigitalAssetOwner handlers (GAP-02/03)
  - Created ChillClaimed + OrbsClaimed handlers (GAP-04/05)
  - All 8 zero-row entity types now have implementations
  - Added comprehensive unit tests for all 4 handlers (1,950 lines)
  - Optimized enrichment queue (removed duplicate Phase 2 calls)
  - Refactored address comparisons to use isAddressEqual + getAddress
  - PR #161 merged with commit d86275e
- **Phase 5.2 in progress (2/3 plans complete):** LSP4 Base URI & Count Parity
  - **GAP-07 ✓ COMPLETE:** LSP8ReferenceContract marked as known V1 divergence (switch fall-through bug)
  - **GAP-08 ✓ COMPLETE:** OwnedAsset double-processing fixed via triggeredBy filtering
  - **GAP-09 ✓ COMPLETE:** Orb handler mint detection defaults (OrbLevel=0, OrbCooldownExpiry=0, OrbFaction='Neutral')
  - **GAP-06 (05.2-03):** LSP4MetadataBaseURI handler (port V1's utils/lsp4MetadataBaseUri.ts flow)
- **Phase 3.2 deferred:** Queue-Based Worker Pool Optimization
- **Merged PRs:**
  - PR #159: Standalone comparison tool package (merged into refactor/indexer-v2)
  - PR #161: Pipeline bug fix + 4 missing entity handlers (merged into refactor/indexer-v2)

---

_Last updated: 2026-02-13_
