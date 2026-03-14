# Roadmap: LSP Indexer

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-02-16)
- ✅ **v1.1 React Hooks Package** — Phases 7-16 (shipped 2026-03-08)
- 🚧 **v1.2 Production Readiness** — Phases 17-22 (in progress, includes 20.1-20.3 inserted)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-02-16</summary>

- [x] Phase 1: Handler Migration (4 plans) — completed
- [x] Phase 2: New Handlers & Structured Logging (4 plans) — completed
- [x] Phase 3: Metadata Fetch Handlers (4 plans) — completed
- [x] Phase 3.1: Debug Logging Strategy (4 plans) — INSERTED
- [x] Phase 4: Integration Wiring (6 plans) — completed
- [x] Phase 5: Deployment Validation (1 plan) — completed
- [x] Phase 5.1: Pipeline Bug Fix (2 plans) — INSERTED
- [x] Phase 5.2: LSP4 Base URI Count Parity (3 plans) — INSERTED
- [x] Phase 5.3: Entity Upsert Standardization (1 plan) — INSERTED
- [x] Phase 6: Tech Debt Cleanup (1 plan) — completed

Full details: `milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 React Hooks Package (Phases 7-16) — SHIPPED 2026-03-08</summary>

- [x] Phase 7: Package Foundation (2 plans) — completed
- [x] Phase 8: First Vertical Slice — Profiles (4 plans) — completed
- [x] Phase 9.1–9.12: Remaining Domains + DX (47 plans) — completed
- [x] Phase 10.1–10.13: Subscriptions (13 plans) — completed
- [x] Phase 11: Server Actions & Publish Readiness (2 plans) — completed
- [x] Phase 12: Replace Local Pkgs → @chillwhales (2 plans) — completed
- [x] Phase 13: Indexer v1 Cleanup (2 plans) — completed
- [x] Phase 14: Code Comments & Release Prep (2 plans) — completed
- [x] Phase 15: CI/CD Workflows & Shared Infra (3 plans) — completed
- [x] Phase 16: Verification Gap Closure (2 plans) — completed

Full details: `milestones/v1.1-ROADMAP.md`

</details>

### 🚧 v1.2 Production Readiness (In Progress)

**Milestone Goal:** Make the indexer production-ready with block-level ordering, sorting across all consumer packages, monitoring, and operational infrastructure.

- [x] **Phase 17: Version Normalization** — Set 0.1.0 for all private packages (completed 2026-03-09)
- [x] **Phase 18: Production Docker Compose** — Production-ready compose using released Docker image (completed 2026-03-09)
- [x] **Phase 19: Block Ordering** — Add blockNumber/transactionIndex/logIndex to all entities (completed 2026-03-09)
- [x] **Phase 19.1: Type System Tightening** — Remove unchecked generics from BatchContext, enforce Entity base type — INSERTED (completed 2026-03-10)
- [ ] **Phase 20: Monitoring & Docker Image Release** — Grafana dashboards + release updated Docker image
- [ ] **Phase 20.1: Structured Logging Overhaul** — Migrate all unstructured logs to queryable structured format — INSERTED
- [ ] **Phase 20.2: Pipeline Instrumentation** — Add step timing and batch summary logs — INSERTED
- [ ] **Phase 20.3: Grafana Dashboard Redesign** — New panels leveraging structured log data — INSERTED
- [x] **Phase 21: Sorting & Consumer Package Release** — Oldest/newest sorting across all 12 domains + release 4 packages (completed 2026-03-12)
- [ ] **Phase 22: Database Operations** — Backup strategy, automation, and recovery procedure

## Phase Details

### Phase 17: Version Normalization
**Goal**: Private packages have clean, consistent versioning
**Depends on**: Nothing (first phase)
**Requirements**: VERS-01, VERS-02, VERS-03, VERS-04
**Success Criteria** (what must be TRUE):
  1. All 4 private packages (`@chillwhales/abi`, `@chillwhales/typeorm`, `@chillwhales/indexer`, `apps/test`) show version 0.1.0 in their package.json
  2. All packages build successfully after version change
**Plans**: 1 plan

Plans:
- [x] 17-01-PLAN.md — Normalize all package versions to 0.1.0 and verify builds

### Phase 18: Production Docker Compose
**Goal**: Anyone can run the full indexer stack in production using the released Docker image
**Depends on**: Nothing (independent of Phase 17, execution order is a preference)
**Requirements**: DOCK-01, DOCK-02, DOCK-03
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` with the production compose file starts the full stack (indexer + PostgreSQL + Hasura) using `ghcr.io/chillwhales/lsp-indexer:latest`
  2. All services are configurable through environment variables (RPC URL, DB credentials, Hasura secrets) without modifying the compose file
  3. The local development compose file continues to work unchanged for contributors
**Plans**: 1 plan

Plans:
- [ ] 18-01-PLAN.md — Create production compose file, env template, and documentation

### Phase 19: Block Ordering
**Goal**: Every indexed entity carries its blockchain position for deterministic ordering
**Depends on**: Phase 17
**Requirements**: BORD-01, BORD-02, BORD-03, BORD-04, BORD-05, BORD-06
**Success Criteria** (what must be TRUE):
  1. Every entity in the database has `blockNumber`, `transactionIndex`, and `logIndex` columns populated from the event that created it
  2. UniversalProfile, DigitalAsset, and NFT entities retain their original (oldest) block/tx/log values even after being updated by subsequent events
  3. All entities compile cleanly after schema.graphql and TypeORM codegen changes
  4. The indexer processes blocks and populates all ordering fields correctly end-to-end
**Plans**: 3 plans

Plans:
- [ ] 19-01-PLAN.md — Schema + interface foundation (block fields on all entities + codegen)
- [ ] 19-02-PLAN.md — EventPlugin + pipeline updates (real block data in enrichment + core entity retention)
- [ ] 19-03-PLAN.md — EntityHandler block propagation (derived entities + metadata sub-entities)

### Phase 19.1: Type System Tightening
**Goal**: BatchContext uses honest types — no unchecked generics on type-erased storage
**Depends on**: Phase 19
**Requirements**: None (refactor, no new requirements)
**Success Criteria** (what must be TRUE):
  1. `getEntities()` returns `Map<string, Entity>` (no generic parameter)
  2. `addEntity()` accepts `Entity` (not `unknown`)
  3. All ~29 handlers compile and cast at the call site where they know the concrete type
  4. All handler tests pass with block field expectations and updated mocks
  5. Integration test passes with fixed multi-event fixture and VerifyFn signature
  6. `pnpm --filter=@chillwhales/indexer build` succeeds with zero errors
  7. Full test suite passes
**Plans**: 2 plans

Plans:
- [x] 19.1-01-PLAN.md — Fix all getEntities generic removal + handler casts + test verification
- [x] 19.1-02-PLAN.md — Entity registry with 71-key type map + typed BatchContext + runtime validation

### Phase 20: Monitoring & Docker Image Release
**Goal**: Production operators can observe indexer health through Grafana and deploy the latest changes
**Depends on**: Phase 18, Phase 19
**Requirements**: MNTR-01, MNTR-02, MNTR-03, RELD-01
**Success Criteria** (what must be TRUE):
  1. Grafana dashboard shows all structured log output from the indexer in real-time
  2. Grafana dashboard shows Subsquid processor (sqd) logs including block processing progress
  3. Monitoring stack (Grafana + log collector) starts automatically with the production docker-compose
  4. Updated Docker image is available at `ghcr.io/chillwhales/lsp-indexer:latest` with block ordering and monitoring
**Plans**: 2 plans

Plans:
- [ ] 20-01-PLAN.md — Monitoring stack infrastructure (Loki, Alloy, Prometheus, cAdvisor, Grafana in compose)
- [ ] 20-02-PLAN.md — Grafana dashboard JSON + Docker image release

### Phase 20.1: Structured Logging Overhaul
**Goal**: Every indexer log call uses structured attrs so all fields are queryable in Grafana/Loki
**Depends on**: Phase 20 (monitoring infrastructure must exist)
**Requirements**: SLOG-01, SLOG-02, SLOG-03, SLOG-04
**Success Criteria** (what must be TRUE):
  1. Zero `console.*` calls remain in indexer source (except worker threads where logger is unavailable)
  2. Zero `JSON.stringify()` calls used as log message arguments
  3. All `metadataFetch.ts` log calls use `(attrs, message)` pattern with extractable fields
  4. All `app/index.ts` startup logs include structured metadata
  5. `pnpm --filter=@chillwhales/indexer build` succeeds
**Plans**: 2 plans

Plans:
- [ ] 20.1-01-PLAN.md — Core infrastructure + startup logging (LOGGING.md, registry injection, config, index.ts)
- [ ] 20.1-02-PLAN.md — Handler + metadataFetch + worker migration (JSON.stringify, template strings, LOG relay)

### Phase 20.2: Pipeline Instrumentation
**Goal**: Every pipeline step emits timing data and a batch summary enables at-a-glance health monitoring
**Depends on**: Phase 20.1 (structured logging foundation)
**Requirements**: INST-01, INST-02, INST-03
**Success Criteria** (what must be TRUE):
  1. Every pipeline step (EXTRACT, PERSIST_RAW, HANDLE, CLEAR_SUB_ENTITIES, DELETE_ENTITIES, PERSIST_DERIVED, VERIFY, ENRICH, RESOLVE) logs `durationMs`
  2. A single batch summary log is emitted at end of `processBatch()` with block range, total entity counts, per-step timings, and total elapsed time
  3. EXTRACT and HANDLE steps have dedicated `createStepLogger` loggers
  4. `pnpm --filter=@chillwhales/indexer build` succeeds
**Plans**: TBD

### Phase 20.3: Grafana Dashboard Redesign
**Goal**: Production dashboard surfaces pipeline health, entity throughput, verification status, and metadata fetch progress
**Depends on**: Phase 20.2 (instrumentation data must exist in logs)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Pipeline step latency panel shows per-step timing breakdown
  2. Entity throughput panel shows entities persisted per batch by entity type
  3. Verification health panel shows valid/invalid/new address counts
  4. Metadata fetch progress panel shows backlog depth, fetch duration, success/failure rates
  5. Batch processing time panel shows total elapsed per batch
  6. All existing panels (block height, errors, logs, container metrics) continue working
**Plans**: TBD

### Phase 21: Sorting & Consumer Package Release
**Goal**: Developers can sort query results by blockchain position (oldest/newest) across all domains
**Depends on**: Phase 19
**Requirements**: SORT-01, SORT-02, SORT-03, SORT-04, SORT-05, RELP-01
**Success Criteria** (what must be TRUE):
  1. All 12 domain services accept an oldest/newest sort parameter that orders by blockNumber, transactionIndex, logIndex
  2. All 12 subscription hooks and React hooks expose the sort order parameter
  3. All 12 Next.js server actions support the sort order parameter
  4. Sort types flow through the full stack (Zod types → GraphQL documents → parsers → services → hooks → server actions)
  5. All 4 consumer packages (`types`, `node`, `react`, `next`) are released with sorting support
**Plans**: 2 plans

Plans:
- [ ] 21-01-PLAN.md — Add newest/oldest sort to all 12 domain types and services
- [ ] 21-02-PLAN.md — Build verification + coordinated package release

### Phase 22: Database Operations
**Goal**: Production database can be backed up and recovered reliably
**Depends on**: Phase 18
**Requirements**: OPS-01, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):
  1. PostgreSQL backup strategy is documented with clear schedule and retention policy
  2. Automated backups run on schedule without manual intervention
  3. Recovery procedure is documented step-by-step and has been tested with a successful restore
**Plans**: TBD

## Progress

**Execution Order:** 17 → 18 → 19 → 19.1 → 20 → 20.1 → 20.2 → 20.3 → 21 → 22

| Phase | Milestone | Plans Complete | Status | Completed |
| --- | --- | --- | --- | --- |
| 1-6 | v1.0 | 36/36 | Complete | 2026-02-16 |
| 7-16 | v1.1 | 77/77 | Complete | 2026-03-08 |
| 17. Version Normalization | v1.2 | 1/1 | Complete | 2026-03-09 |
| 18. Production Docker Compose | v1.2 | 1/1 | Complete | 2026-03-09 |
| 19. Block Ordering | v1.2 | 3/3 | Complete | 2026-03-09 |
| 19.1. Type System Tightening | v1.2 | 2/2 | Complete | 2026-03-10 |
| 20. Monitoring & Docker Release | v1.2 | 1/2 | In Progress | - |
| 20.1. Structured Logging Overhaul | v1.2 | 0/TBD | Not started | - |
| 20.2. Pipeline Instrumentation | v1.2 | 0/TBD | Not started | - |
| 20.3. Grafana Dashboard Redesign | v1.2 | 0/TBD | Not started | - |
| 21. Sorting & Package Release | v1.2 | 2/2 | Complete | 2026-03-12 |
| 22. Database Operations | v1.2 | 0/TBD | Not started | - |

---

_Created: 2026-02-06_
_Last updated: 2026-03-12 — Phases 20.1-20.3 inserted (logging overhaul + instrumentation + dashboard redesign)_
