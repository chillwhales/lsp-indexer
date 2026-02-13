# Roadmap: LSP Indexer V2

**Created:** 2026-02-06
**Depth:** Standard
**Phases:** 9 (5 original + 4 inserted)
**Coverage:** 21/21 v1 requirements mapped + 8 urgent requirements + 9 parity gap requirements

## Overview

Complete the V2 rewrite of the LUKSO LSP Indexer by migrating remaining handlers to the EntityHandler interface, building new handlers and metadata fetchers, wiring the full pipeline together, and validating data parity against V1 before production cutover. The phases follow the natural dependency chain: existing handlers must be migrated before new ones can be built, all handlers must exist before integration wiring, and the full pipeline must work before deployment validation.

---

## Phase 1 — Handler Migration

**Goal:** All existing handler implementations run as standalone EntityHandlers using the V2 interface, and all legacy code is deleted.

**Dependencies:** None — this is the foundation phase.

**Requirements:**

| ID      | Requirement                                                                                           |
| ------- | ----------------------------------------------------------------------------------------------------- |
| HMIG-01 | totalSupply handler as standalone EntityHandler with `listensToBag: ['LSP7Transfer', 'LSP8Transfer']` |
| HMIG-02 | ownedAssets handler as standalone EntityHandler with `listensToBag: ['LSP7Transfer', 'LSP8Transfer']` |
| HMIG-03 | decimals handler adapted to new EntityHandler interface                                               |
| HMIG-04 | FormattedTokenId handler populating `NFT.formattedTokenId` based on LSP8TokenIdFormat                 |
| HMIG-05 | No legacy code remains — DataKeyPlugin interface, populate helpers, handler helpers all deleted       |

**Plans:**

- [x] **01-01** (Wave 1): Infrastructure — async handle, delete queue, Step 5.5 hook, registry ordering
- [x] **01-02** (Wave 2): totalSupply + ownedAssets handlers (HMIG-01, HMIG-02)
- [x] **01-03** (Wave 2): decimals + formattedTokenId handlers (HMIG-03, HMIG-04)
- [x] **01-04** (Wave 3): Legacy code deletion (HMIG-05)

**Success Criteria:**

1. User can run unit tests for totalSupply, ownedAssets, and decimals handlers and see them process events identically to their V1 counterparts
2. User can see FormattedTokenId handler produce formatted token IDs matching V1 output for LSP8 tokens
3. User can search the codebase and find zero references to DataKeyPlugin, populate helpers, or handler helpers — all legacy interfaces are gone
4. User can see every EntityHandler self-selects from BatchContext via `listensToBag` without any direct invocation

---

## Phase 2 — New Handlers & Structured Logging

**Goal:** Follower and permissions handlers deliver complete event coverage for remaining V1 entity types, while structured logging provides observability across all pipeline steps.

**Dependencies:** Phase 1 (EntityHandler patterns established and validated)

**Requirements:**

| ID      | Requirement                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| HNDL-01 | Follow entities created with deterministic IDs when Follow events occur           |
| HNDL-02 | Follow entities removed when Unfollow events occur                                |
| HNDL-03 | LSP6 permission sub-entities correctly deleted and re-created on data key changes |
| INFR-01 | Structured JSON logs with consistent field schemas across all 6 pipeline steps    |
| INFR-02 | Logs filterable by severity level (info/warn/debug) and by pipeline step          |

**Success Criteria:**

1. User can trigger Follow/Unfollow events and see Follow entities appear and disappear with deterministic IDs matching V1's ID generation
2. User can change LSP6 permission data keys and see old permission sub-entities cleared and new ones created in the correct order
3. User can see structured JSON log output with consistent fields (`step`, `level`, `blockRange`, `entityCount`) across all 6 pipeline steps
4. User can filter logs by severity and pipeline step to isolate specific processing phases

**Parallelization Note:** INFR-01/INFR-02 (structured logging) can be built in parallel with HNDL-01/HNDL-02/HNDL-03 (new handlers) since they have no mutual dependencies.

**Plans:** 4 plans

Plans:

- [x] 02-01-PLAN.md — Structured logger module (pino + createStepLogger factory)
- [x] 02-02-PLAN.md — Follower handler + EventPlugin TypeScript sources + unit tests
- [x] 02-03-PLAN.md — LSP6Controllers handler TypeScript port + verification unit tests
- [x] 02-04-PLAN.md — Replace all JSON.stringify logging with structured attributes

---

## Phase 3 — Metadata Fetch Handlers

**Goal:** All three metadata standards (LSP3, LSP4, LSP29) are fetched from IPFS/HTTP, parsed into sub-entities, and persisted — with proper head-only gating and retry handling.

**Dependencies:** Phase 1 (EntityHandler patterns), Phase 2 (logging available for observability during metadata fetches)

**Requirements:**

| ID      | Requirement                                                                        |
| ------- | ---------------------------------------------------------------------------------- |
| META-01 | LSP3 profile metadata fetched from IPFS/HTTP and 7 sub-entity types created        |
| META-02 | LSP4 digital asset metadata fetched and 8 sub-entity types plus Score/Rank created |
| META-03 | LSP29 encrypted asset metadata fetched and 7 sub-entity types created              |
| META-04 | Metadata handlers only fetch at chain head (`isHead === true`)                     |
| META-05 | Metadata fetch failures retried with proper error tracking                         |

**Success Criteria:**

1. User can see LSP3 profile metadata fetched and all 7 sub-entity types (ProfileImage, BackgroundImage, ProfileTag, ProfileLink, etc.) persisted matching V1 structure
2. User can see LSP4 digital asset metadata fetched and all 8 sub-entity types plus Score/Rank persisted matching V1 structure
3. User can see LSP29 encrypted metadata fetched and all 7 sub-entity types persisted matching V1 structure
4. User can verify that during historical sync (`isHead === false`), no metadata HTTP/IPFS requests are made — fetching is deferred until chain head
5. User can see failed metadata fetches logged with error details, retried according to backoff policy, and never causing spin-wait or infinite loops

**Plans:** 4 plans

Plans:

- [x] 03-01-PLAN.md — FetchResult type fix + shared metadata fetch utility + V1 type guards
- [x] 03-02-PLAN.md — LSP3 + LSP29 metadata fetch handlers (7 + 7 sub-entity types)
- [x] 03-03-PLAN.md — LSP4 metadata fetch handler (8 sub-entity types + Score/Rank)
- [ ] 03-04-PLAN.md — Unit tests for all three metadata fetch handlers

---

## Phase 3.1 — Improve Debug Logging Strategy (INSERTED)

**Goal:** Create structured debug logging infrastructure with configurable log levels and component-specific debug flags, enabling faster debugging of worker pool, metadata fetch, and pipeline issues.

**Dependencies:** Phase 3 (Metadata Fetch Handlers)

**Requirements:**

| ID     | Requirement                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| LOG-01 | Logger utility module with ERROR, WARN, INFO, DEBUG, TRACE levels              |
| LOG-02 | Component-specific debug flags (DEBUG_WORKER_POOL, DEBUG_METADATA_FETCH, etc.) |
| LOG-03 | Environment variable control (LOG_LEVEL, DEBUG_COMPONENTS)                     |
| LOG-04 | Apply logger to worker pool, metadata fetch handlers, and pipeline             |

**Success Criteria:**

1. User can set `LOG_LEVEL=debug` and see debug-level logs from all components
2. User can set `DEBUG_COMPONENTS=worker_pool,metadata_fetch` and see only those component logs
3. User can trace worker pool operations without modifying code (no console.log debugging)
4. User can see structured log output with consistent fields (timestamp, level, component, message, context)

**Plans:** 2 plans

Plans:

- [x] 03.1-01-PLAN.md — Component-specific debug logging (logger enhancement + worker pool + metadata handlers)
- [x] 03.1-02-PLAN.md — Fix missing imports for createComponentLogger/getFileLogger (gap closure)

**Details:**

[To be added during planning]

**Context:** Discovered during PR #152 debugging — took too long to find metadata worker pool bug because worker operations were invisible without code modifications.

---

## Phase 3.2 — Queue-Based Worker Pool Optimization (INSERTED)

**Goal:** Refactor MetadataWorkerPool from batch-wait pattern to queue-based architecture, keeping N workers busy at all times for ~2x throughput improvement.

**Dependencies:** Phase 3.1 (Improved logging will help validate queue behavior)

**Requirements:**

| ID      | Requirement                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| PERF-01 | Queue-based worker pool architecture (replace batch-wait pattern)            |
| PERF-02 | Keep N workers busy with X requests each (configurable)                      |
| PERF-03 | Environment variables: WORKER_POOL_SIZE, WORKER_BATCH_SIZE, FETCH_LIMIT      |
| PERF-04 | Maintain error handling, timeout protection, and entity marking from PR #152 |

**Success Criteria:**

1. User can see workers never idle when work is available (no wait between batches)
2. User can configure `WORKER_POOL_SIZE=4` and `WORKER_BATCH_SIZE=250` to tune performance
3. User can see ~2x throughput improvement (process 1,000 URLs in ~17s vs ~35s)
4. User can verify error handling still marks entities with errors on batch failures

**Plans:** 0 plans

Plans:

- [ ] TBD (run `/gsd-plan-phase 3.2` to break down)

**Details:**

[To be added during planning]

**Context:** Discovered during PR #152 optimization — batch-wait pattern leaves workers idle during result processing. Queue-based approach keeps workers continuously busy.

---

## Phase 4 — Integration & Wiring

**Goal:** All EventPlugins and EntityHandlers are discovered, registered, and wired into a bootable application that processes blocks through all 6 pipeline steps end-to-end.

**Dependencies:** Phase 1, Phase 2, Phase 3 (all handlers must exist before wiring)

**Requirements:**

| ID      | Requirement                                                                          |
| ------- | ------------------------------------------------------------------------------------ |
| INTG-01 | Processor configured with all EventPlugin log subscriptions from the registry        |
| INTG-02 | Application boots with all EventPlugins and EntityHandlers discovered and registered |
| INTG-03 | Integration tests with real block fixtures verify all 6 pipeline steps               |
| INTG-04 | Handler ordering preserves V1's dependency graph                                     |

**Success Criteria:**

1. User can boot the V2 application and see all 11 EventPlugins and all EntityHandlers discovered, registered, and logged in correct dependency order
2. User can see the Subsquid processor configured with topic subscriptions that exactly match V1's event coverage — no missing events
3. User can run integration tests with real LUKSO block fixtures and see data flow through EXTRACT → PERSIST RAW → HANDLE → PERSIST DERIVED → VERIFY → ENRICH with correct output
4. User can verify handler execution order matches V1's dependency graph (e.g., NFT before FormattedTokenId, transfers before totalSupply/ownedAssets)

---

## Phase 5 — Deployment & Validation

**Goal:** V2 runs alongside V1 in Docker and automated comparison proves data parity, enabling production cutover.

**Dependencies:** Phase 4 (fully working, tested application)

**Requirements:**

| ID      | Requirement                                                                    |
| ------- | ------------------------------------------------------------------------------ |
| DEPL-01 | V2 runs alongside V1 in Docker with separate databases indexing the same chain |
| DEPL-02 | Automated comparison between V1 and V2 database state                          |

**Success Criteria:**

1. User can run V1 and V2 on separate Docker stacks (each has its own docker-compose) indexing the same LUKSO chain data into separate PostgreSQL databases
2. User can run an automated comparison CLI that queries two Hasura GraphQL endpoints and reports per-entity-type row counts and sampled content diffs, with an exclusion list for known divergences (null FKs vs entity removal, unknown token format returns null)

**Plans:** 2 plans

Plans:

- [x] 05-01-PLAN.md — Types, entity registry (72 types + known divergences), GraphQL client
- [x] 05-02-PLAN.md — Comparison engine, colored reporter, CLI entry point + human verification

**Note:** DEPL-01 is satisfied by existing Docker infrastructure (V1 and V2 each have their own docker-compose). The deliverable is the comparison tool (DEPL-02) — a CLI that queries two running Hasura endpoints via GraphQL and reports data parity.

---

## Phase 5.1 — Pipeline Bug Fix & Missing Core Handlers (INSERTED)

**Goal:** Fix the contract filter address comparison bug that silences 4 entity types, and implement the 4 missing EntityHandlers for ownership and custom game entities.

**Dependencies:** Phase 5 (comparison tool identified the gaps)

**Requirements:**

| ID     | Requirement                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------- |
| GAP-01 | Contract filter address comparison is case-insensitive (fixes Follow, Unfollow, Deployed\* = 0) |
| GAP-02 | UniversalProfileOwner entities created from OwnershipTransferred events (postVerification)      |
| GAP-03 | DigitalAssetOwner entities created from OwnershipTransferred events (postVerification)          |
| GAP-04 | ChillClaimed entities created when Chillwhale NFTs are minted via LSP8 Transfer from zero       |
| GAP-05 | OrbsClaimed entities created when Orbs NFTs are minted via LSP7/LSP8 Transfer from zero         |

**Success Criteria:**

1. User can re-index and see Follow (>100K), Unfollow (>2K), DeployedContracts (>0), DeployedERC1167Proxies (>35K) rows appear — matching V1 counts
2. User can see UniversalProfileOwner and DigitalAssetOwner rows created for every OwnershipTransferred event, matching V1 counts
3. User can see ChillClaimed and OrbsClaimed rows matching V1 counts after full re-index
4. Comparison tool shows these 8 entity types as ✓ MATCH or within 2% tolerance

**Plans:** 2 plans

Plans:

- [x] 05.1-01-PLAN.md — Pipeline address comparison fix + UniversalProfileOwner/DigitalAssetOwner handlers
- [x] 05.1-02-PLAN.md — ChillClaimed + OrbsClaimed handlers (Chillwhales game entities)

**Context:** Discovered via comparison tool (Phase 5) — V2 has zero rows for Follow, Unfollow, DeployedContracts, DeployedERC1167Proxies due to case-sensitive address comparison in `pipeline.ts:205`. UniversalProfileOwner/DigitalAssetOwner handlers were never written (referenced as issue #105 in V2 code comments). ChillClaimed/OrbsClaimed handlers never ported from V1.

---

## Phase 5.2 — LSP4 Metadata Base URI Derivation & Count Parity (INSERTED)

**Goal:** Implement the missing LSP4 metadata base URI → per-token LSP4Metadata derivation flow, and investigate/fix remaining count mismatches (OwnedAsset, LSP8ReferenceContract, Orb entities).

**Dependencies:** Phase 5.1 (core pipeline bug must be fixed first)

**Requirements:**

| ID     | Requirement                                                                                  |
| ------ | -------------------------------------------------------------------------------------------- |
| GAP-06 | LSP4Metadata entities derived from LSP8TokenMetadataBaseURI + NFT tokenIds (V1 BaseURI flow) |
| GAP-07 | LSP8ReferenceContract count matches V1 within tolerance (investigate DataChanged delivery)   |
| GAP-08 | OwnedAsset creation scope matches V1 behavior (UP-only filter vs all addresses)              |
| GAP-09 | Orb entity counts (OrbLevel, OrbCooldownExpiry, OrbFaction) match V1 within tolerance        |

**Success Criteria:**

1. User can see LSP4Metadata row count within 2% of V1 (currently 32K vs 116K — ~84K missing from base URI derivation)
2. User can see LSP8ReferenceContract count within 2% of V1
3. User can see OwnedAsset count within 2% of V1 (currently V2 has 14K MORE — need to align creation scope)
4. Comparison tool shows all entity types as ✓ MATCH or ≈ TOLERANCE with `--tolerance=2`

**Plans:** 3 plans

Plans:

- [ ] 05.2-01-PLAN.md — OwnedAsset triggeredBy fix (GAP-08) + LSP8ReferenceContract divergence (GAP-07)
- [ ] 05.2-02-PLAN.md — Orb handler mint detection defaults (GAP-09)
- [ ] 05.2-03-PLAN.md — LSP4 Base URI derivation handler (GAP-06)

**Context:** Discovered via comparison tool (Phase 5). LSP4Metadata gap is caused by V2 missing the base URI → per-token derivation flow that V1 implements in `utils/lsp4MetadataBaseUri.ts`. OwnedAsset count is currently HIGHER in V2 due to double-processing (ignoring `triggeredBy`) rather than UP-only filtering assumptions from earlier analysis. Orb-related entity gaps are now attributed to missing mint-time defaults in the Orb handlers, while LSP8ReferenceContract is treated as a known V1 divergence rather than a parity bug.

---

## Phase 5.3 — Entity Upsert Pattern Standardization (INSERTED)

**Goal:** Introduce `resolveEntity`/`resolveEntities` helpers and refactor ALL 13 handlers that do entity lookups to use a single recognizable pattern: **resolve → spread → override → addEntity**. Fixes 3 bugs and 2 gaps while establishing codebase-wide consistency.

**Dependencies:** Phase 5.2 (builds on handler code from 5.2)

**Requirements:**

| ID       | Requirement                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| UPSRT-01 | `resolveEntity<T>()` and `resolveEntities<T>()` helpers created, `mergeEntitiesFromBatchAndDb` deleted                           |
| UPSRT-02 | Tier 1 bugfix: chillClaimed, orbsClaimed, lsp5ReceivedAssets, orbLevel, orbFaction use resolve + spread                          |
| UPSRT-03 | Tier 2 standardize: totalSupply, ownedAssets, nft use resolve + spread (replacing manual lookups)                                |
| UPSRT-04 | Tier 2 standardize: lsp4Creators, lsp12IssuedAssets, lsp6Controllers, formattedTokenId, lsp4MetadataBaseUri use resolve + spread |

**Success Criteria:**

1. User can search the codebase for `mergeEntitiesFromBatchAndDb` and find zero references — fully replaced by `resolveEntities`
2. User can verify that all 13 handlers that update existing entities use the same recognizable pattern: `resolveEntity`/`resolveEntities` → `...existing` spread → `addEntity()`
3. User can verify ChillClaimed/OrbsClaimed retain FK references after Phase 2 verification (bug fix)
4. User can verify lsp5ReceivedAssets correctly persists cross-batch merge data (bug fix)
5. User can verify OrbLevel/OrbFaction preserve FKs across batch boundaries (gap fix)
6. All existing tests pass — behavior unchanged, only implementation unified

**Plans:** 0 plans (run `/gsd-plan-phase 5.3` to break down)

Plans:

- [ ] TBD

**Context:** Comprehensive audit of all 29 handlers found 4 different ad-hoc patterns for the same operation ("entity might already exist"). This produced 3 confirmed bugs (chillClaimed/orbsClaimed FK wipe, lsp5ReceivedAssets missing addEntity) and 2 cross-batch gaps (orbLevel/orbFaction). Rather than patching only the broken handlers, we standardize ALL 13 handlers that do entity lookups to a single recognizable pattern.

---

## Progress

| Phase | Name                                  | Requirements | Status   |
| ----- | ------------------------------------- | :----------: | -------- |
| 1     | Handler Migration                     |      5       | Complete |
| 2     | New Handlers & Structured Logging     |      5       | Complete |
| 3     | Metadata Fetch Handlers               |      5       | Complete |
| 3.1   | Improve Debug Logging Strategy        |      4       | Complete |
| 3.2   | Queue-Based Worker Pool               |      4       | Deferred |
| 4     | Integration & Wiring                  |      4       | Complete |
| 5     | Deployment & Validation               |      2       | Complete |
| 5.1   | Pipeline Bug Fix & Missing Handlers   |      5       | Complete |
| 5.2   | LSP4 Base URI & Count Parity          |      4       | Complete |
| 5.3   | Entity Upsert Pattern Standardization |      4       | Planned  |

**Total:** 42 requirements across 10 phases (5 original + 5 inserted)

---

## Dependency Graph

```
Phase 1 (Handler Migration)
  ├──→ Phase 2 (New Handlers & Logging)
  │      ├──→ Phase 3 (Metadata Fetchers) ←── also depends on Phase 1
  │      │      ├──→ Phase 3.1 (Debug Logging) ←── INSERTED URGENT
  │      │      │      └──→ Phase 3.2 (Queue-Based Workers) ←── INSERTED URGENT (Deferred)
  │      │      │
  │      │      └──→ Phase 4 (Integration & Wiring)
  │      └──→ Phase 4
  └──→ Phase 3
           └──→ Phase 5 (Deployment & Validation)
                  └──→ Phase 5.1 (Pipeline Bug Fix & Missing Handlers) ←── INSERTED
                         └──→ Phase 5.2 (LSP4 Base URI & Count Parity) ←── INSERTED
                                └──→ Phase 5.3 (Entity Upsert Pattern Standardization) ←── INSERTED
```

**Parallelization opportunities:**

- Within Phase 2: Logging (INFR-01, INFR-02) parallel with new handlers (HNDL-01–03)
- Phase 3 can start as soon as Phase 1 completes, overlapping with Phase 2's tail
- **Phases 3.1 and 3.2 are INSERTED urgent work discovered during Phase 3 execution (PR #152)**
- **Phases 5.1 and 5.2 are INSERTED gap closure work discovered via Phase 5 comparison tool**
- Within Phase 5.1: Contract filter fix and missing handler implementations can be parallelized

---

## Roadmap Evolution

**2026-02-11:** Inserted Phase 3.1 (Debug Logging) and Phase 3.2 (Queue-Based Workers) after Phase 3

- **Reason:** Urgent improvements discovered during PR #152 debugging (indexer-v2 hung at block 6,729,432)
- **Context:** Debug logging would have accelerated bug discovery; queue-based workers improve throughput 2x
- **Numbering:** Decimal phases (3.1, 3.2) preserve logical sequence while accommodating urgent work

**2026-02-12:** Inserted Phase 5.1 (Pipeline Bug Fix & Missing Handlers) and Phase 5.2 (LSP4 Base URI & Count Parity) after Phase 5

- **Reason:** V1 vs V2 comparison tool revealed significant data gaps — 8 entity types with zero rows, several with large count mismatches
- **Root causes identified:**
  - Contract filter address comparison in `pipeline.ts:205` uses strict `!==` instead of case-insensitive comparison, silencing Follow/Unfollow/Deployed\* events
  - UniversalProfileOwner and DigitalAssetOwner handlers were never written (referenced as TODO in issue #105)
  - ChillClaimed and OrbsClaimed handlers never ported from V1
  - LSP4Metadata base URI → per-token derivation flow missing (~84K rows)
  - OwnedAsset creation scope broader in V2 (all addresses vs V1's UP-only filter)
- **Numbering:** Decimal phases (5.1, 5.2) preserve logical sequence

**2026-02-13:** Inserted Phase 5.3 (Entity Upsert Pattern Standardization) after Phase 5.2

- **Reason:** Comprehensive handler audit revealed 4 different ad-hoc patterns for the same operation ("entity might already exist"), producing 3 bugs and 2 gaps
- **Approach:** Rather than patching only broken handlers, standardize ALL 13 handlers that do entity lookups to one recognizable pattern: `resolveEntity`/`resolveEntities` → `...existing` spread → `addEntity()`
- **Bugs found:**
  - chillClaimed/orbsClaimed Phase 2 verification wipes FK values (creates new entities with null FKs instead of preserving existing)
  - lsp5ReceivedAssets cross-batch merge modifies DB entities in-memory but never calls addEntity() (merged data silently lost)
- **Gaps found:**
  - orbLevel/orbFaction only check batch (not DB) for existing entities in TokenIdDataChanged path
- **Scope:** ~500 lines (13 handlers + helpers + tests), 4 requirements, 4 plans
- **Numbering:** Decimal phase (5.3) preserves logical sequence

---

_Created: 2026-02-06_
_Last updated: 2026-02-13_
