# Requirements: LSP Indexer v1.2

**Defined:** 2026-03-08
**Core Value:** Any developer can query LUKSO blockchain data through type-safe React hooks backed by a reliable indexer.

## v1.2 Requirements

Requirements for v1.2 Production Readiness. Each maps to roadmap phases.

### Docker Compose

- [x] **DOCK-01**: Production docker-compose pulls `ghcr.io/chillwhales/lsp-indexer:latest` and runs indexer + PostgreSQL + Hasura
- [x] **DOCK-02**: Local docker-compose (existing) remains the default for development
- [x] **DOCK-03**: Production compose is configurable via environment variables (RPC URL, DB credentials, Hasura secrets)

### Block Ordering

- [x] **BORD-01**: Every TypeORM entity has `blockNumber`, `transactionIndex`, and `logIndex` columns
- [x] **BORD-02**: All EventPlugins populate block/tx/log fields from the decoded event context
- [x] **BORD-03**: All EntityHandlers populate block/tx/log fields from the triggering event
- [x] **BORD-04**: UniversalProfile, DigitalAsset, and NFT entities retain block/tx/log from the oldest (first) event — later updates do not overwrite these fields
- [x] **BORD-05**: schema.graphql updated with block ordering fields on all entities
- [x] **BORD-06**: TypeORM codegen rebuilt and all entities compile cleanly

### Monitoring

- [ ] **MNTR-01**: Grafana dashboard displays all structured log output from the indexer
- [ ] **MNTR-02**: Grafana dashboard displays Subsquid processor (sqd) logs
- [x] **MNTR-03**: Monitoring stack (Grafana + log collector) included in production docker-compose

### Release — Docker Image

- [ ] **RELD-01**: New Docker image released to `ghcr.io/chillwhales/lsp-indexer` with block ordering changes

### Sorting

- [x] **SORT-01**: All 12 query domain services support sorting by oldest and newest based on blockNumber, transactionIndex, logIndex
- [x] **SORT-02**: All 12 subscription hooks support oldest/newest sort order
- [x] **SORT-03**: All 12 React hooks support oldest/newest sort order parameter
- [x] **SORT-04**: All 12 Next.js server actions support oldest/newest sort order parameter
- [x] **SORT-05**: Sort parameter propagates through types, documents, parsers, and services

### Release — Consumer Packages

- [x] **RELP-01**: All 4 packages (`types`, `node`, `react`, `next`) released with sorting support

### Versioning

- [x] **VERS-01**: `@chillwhales/abi` package.json version set to 0.1.0
- [x] **VERS-02**: `@chillwhales/typeorm` package.json version set to 0.1.0
- [x] **VERS-03**: `@chillwhales/indexer` package.json version set to 0.1.0
- [x] **VERS-04**: `apps/test` package.json version set to 0.1.0

### Structured Logging

- [x] **SLOG-01**: All `console.*` calls in indexer source migrated to structured Subsquid logger output, except worker threads where logger is unavailable, with queryable fields
- [x] **SLOG-02**: All `JSON.stringify()` anti-pattern log calls converted to proper `(attrs, message)` pattern
- [x] **SLOG-03**: All template string log messages in `metadataFetch.ts` converted to structured attrs
- [x] **SLOG-04**: All startup logs in `app/index.ts` include structured metadata fields

### Pipeline Instrumentation

- [x] **INST-01**: Every pipeline step (EXTRACT through RESOLVE) emits timing data (`durationMs`)
- [x] **INST-02**: Batch summary log emitted at end of `processBatch()` with block range, entity counts, step timings, total elapsed
- [x] **INST-03**: EXTRACT and HANDLE steps have dedicated loggers (currently silent)

### Grafana Dashboard

- [x] **DASH-01**: Dashboard includes pipeline step latency panel (per-step timing breakdown)
- [x] **DASH-02**: Dashboard includes entity throughput panel (entities persisted per batch by type)
- [x] **DASH-03**: Dashboard includes verification health panel (valid/invalid/new counts)
- [x] **DASH-04**: Dashboard includes metadata fetch progress panel (backlog depth, fetch duration, success/failure)
- [x] **DASH-05**: Dashboard includes batch processing time panel (total elapsed per batch)

### Operations

- [ ] **OPS-01**: PostgreSQL backup strategy defined and documented
- [ ] **OPS-02**: Backup automation configured (scheduled dumps or WAL archiving)
- [ ] **OPS-03**: Recovery procedure documented and tested

### LSP29/LSP31 Decoding Update

- [x] **LSP29-01**: `@chillwhales/lsp29` installed as indexer dependency and hand-rolled `src/constants/lsp29.ts` deleted
- [x] **LSP29-02**: TypeORM `schema.graphql` entities redesigned for v2.0.0 spec (provider-first encryption, per-backend chunks, encryption params entity replaces access control conditions)
- [x] **LSP29-03**: TypeORM codegen rebuilt and all generated entity classes compile cleanly
- [x] **LSP29-04**: `lsp29EncryptedAsset.handler.ts` imports data keys from `@chillwhales/lsp29` package (no hand-rolled constants)
- [x] **LSP29-05**: `lsp29EncryptedAssetFetch.handler.ts` uses `isLsp29Asset()` type guard from package for JSON validation (no hand-rolled type guards/extractors)
- [x] **LSP29-06**: All hand-rolled LSP29 type guards and extractors removed from `src/utils/index.ts`
- [x] **LSP29-07**: `types` package `encrypted-assets.ts` Zod schemas match new entity structure (encryption, chunks, params)
- [x] **LSP29-08**: `node` package GraphQL documents, parsers, and service rewritten for new Hasura schema
- [x] **LSP29-09**: `react` hooks and `next` server actions compile with breaking type changes
- [x] **LSP29-10**: Full monorepo builds successfully (`pnpm build`)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### High Availability

- **HA-01**: Multi-instance deployment with automatic failover
- **HA-02**: Comparison tool running on timer to validate instance consistency
- **HA-03**: Auto-scaling by duplicating indexer stack under load

### Developer Experience

- **DX-01**: SSR hydration examples and documentation
- **DX-02**: Select transform helpers
- **DX-03**: Domain-specific stale time tuning

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-instance auto-scaling | No scaling pressure yet, overkill for current traffic |
| Kubernetes orchestration | Too complex for current deployment needs |
| VPS migration (Dokploy → Proxmox) | Infra decision, outside milestone scope |
| CI/CD for Docker image builds | Can be added later |
| Marketplace functionality | Removed from scope |
| Mutations/write hooks | Indexer is read-only |
| Mobile-specific hooks | React Native deferred, web-first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VERS-01 | Phase 17 | Complete |
| VERS-02 | Phase 17 | Complete |
| VERS-03 | Phase 17 | Complete |
| VERS-04 | Phase 17 | Complete |
| DOCK-01 | Phase 18 | Complete |
| DOCK-02 | Phase 18 | Complete |
| DOCK-03 | Phase 18 | Complete |
| BORD-01 | Phase 19 | Complete |
| BORD-02 | Phase 19 | Complete |
| BORD-03 | Phase 19 | Complete |
| BORD-04 | Phase 19 | Complete |
| BORD-05 | Phase 19 | Complete |
| BORD-06 | Phase 19 | Complete |
| MNTR-01 | Phase 20 | Pending |
| MNTR-02 | Phase 20 | Pending |
| MNTR-03 | Phase 20 | Complete |
| RELD-01 | Phase 20 | Pending |
| SORT-01 | Phase 21 | Complete |
| SORT-02 | Phase 21 | Complete |
| SORT-03 | Phase 21 | Complete |
| SORT-04 | Phase 21 | Complete |
| SORT-05 | Phase 21 | Complete |
| RELP-01 | Phase 21 | Complete |
| SLOG-01 | Phase 20.1 | Complete |
| SLOG-02 | Phase 20.1 | Complete |
| SLOG-03 | Phase 20.1 | Complete |
| SLOG-04 | Phase 20.1 | Complete |
| INST-01 | Phase 20.2 | Complete |
| INST-02 | Phase 20.2 | Complete |
| INST-03 | Phase 20.2 | Complete |
| DASH-01 | Phase 20.3 | Complete |
| DASH-02 | Phase 20.3 | Complete |
| DASH-03 | Phase 20.3 | Complete |
| DASH-04 | Phase 20.3 | Complete |
| DASH-05 | Phase 20.3 | Complete |
| OPS-01 | Phase 22 | Pending |
| OPS-02 | Phase 22 | Pending |
| OPS-03 | Phase 22 | Pending |
| LSP29-01 | Phase 23 | Complete |
| LSP29-02 | Phase 23 | Complete |
| LSP29-03 | Phase 23 | Complete |
| LSP29-04 | Phase 23 | Complete |
| LSP29-05 | Phase 23 | Complete |
| LSP29-06 | Phase 23 | Complete |
| LSP29-07 | Phase 23 | Complete |
| LSP29-08 | Phase 23 | Complete |
| LSP29-09 | Phase 23 | Complete |
| LSP29-10 | Phase 23 | Complete |

**Coverage:**
- v1.2 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-14 — Added LSP29 requirements for Phase 23*
