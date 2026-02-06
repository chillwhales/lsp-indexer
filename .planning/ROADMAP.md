# Roadmap: LSP Indexer V2

**Created:** 2026-02-06
**Depth:** Standard
**Phases:** 5
**Coverage:** 21/21 v1 requirements mapped

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

1. User can run `docker compose up` and see both V1 and V2 indexing the same LUKSO chain data into separate PostgreSQL databases simultaneously
2. User can run an automated comparison script that reports per-table row counts and content diffs between V1 and V2 databases, with an exclusion list for known V1 bugs and expected architectural divergences (null FKs vs entity removal)

---

## Progress

| Phase | Name                              | Requirements | Status      |
| ----- | --------------------------------- | :----------: | ----------- |
| 1     | Handler Migration                 |      5       | Not Started |
| 2     | New Handlers & Structured Logging |      5       | Complete    |
| 3     | Metadata Fetch Handlers           |      5       | Not Started |
| 4     | Integration & Wiring              |      4       | Not Started |
| 5     | Deployment & Validation           |      2       | Not Started |

**Total:** 21 requirements across 5 phases

---

## Dependency Graph

```
Phase 1 (Handler Migration)
  ├──→ Phase 2 (New Handlers & Logging)
  │      ├──→ Phase 3 (Metadata Fetchers) ←── also depends on Phase 1
  │      │      └──→ Phase 4 (Integration & Wiring) ←── depends on 1, 2, 3
  │      │             └──→ Phase 5 (Deployment & Validation)
  │      └──→ Phase 4
  └──→ Phase 3
```

**Parallelization opportunities:**

- Within Phase 2: Logging (INFR-01, INFR-02) parallel with new handlers (HNDL-01–03)
- Phase 3 can start as soon as Phase 1 completes, overlapping with Phase 2's tail — but Phase 3 benefits from logging being available

---

_Created: 2026-02-06_
_Last updated: 2026-02-06_
