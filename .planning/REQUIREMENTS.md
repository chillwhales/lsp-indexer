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
- [ ] **MNTR-03**: Monitoring stack (Grafana + log collector) included in production docker-compose

### Release — Docker Image

- [ ] **RELD-01**: New Docker image released to `ghcr.io/chillwhales/lsp-indexer` with block ordering changes

### Sorting

- [ ] **SORT-01**: All 12 query domain services support sorting by oldest and newest based on blockNumber, transactionIndex, logIndex
- [ ] **SORT-02**: All 12 subscription hooks support oldest/newest sort order
- [ ] **SORT-03**: All 12 React hooks support oldest/newest sort order parameter
- [ ] **SORT-04**: All 12 Next.js server actions support oldest/newest sort order parameter
- [ ] **SORT-05**: Sort parameter propagates through types, documents, parsers, and services

### Release — Consumer Packages

- [ ] **RELP-01**: All 4 packages (`types`, `node`, `react`, `next`) released with sorting support

### Versioning

- [x] **VERS-01**: `@chillwhales/abi` package.json version set to 0.1.0
- [x] **VERS-02**: `@chillwhales/typeorm` package.json version set to 0.1.0
- [x] **VERS-03**: `@chillwhales/indexer` package.json version set to 0.1.0
- [x] **VERS-04**: `apps/test` package.json version set to 0.1.0

### Operations

- [ ] **OPS-01**: PostgreSQL backup strategy defined and documented
- [ ] **OPS-02**: Backup automation configured (scheduled dumps or WAL archiving)
- [ ] **OPS-03**: Recovery procedure documented and tested

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
| MNTR-03 | Phase 20 | Pending |
| RELD-01 | Phase 20 | Pending |
| SORT-01 | Phase 21 | Pending |
| SORT-02 | Phase 21 | Pending |
| SORT-03 | Phase 21 | Pending |
| SORT-04 | Phase 21 | Pending |
| SORT-05 | Phase 21 | Pending |
| RELP-01 | Phase 21 | Pending |
| OPS-01 | Phase 22 | Pending |
| OPS-02 | Phase 22 | Pending |
| OPS-03 | Phase 22 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
