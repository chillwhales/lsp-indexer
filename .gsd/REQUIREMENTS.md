# Requirements

## Active

### RELD-01 — New Docker image released to `ghcr.io/chillwhales/lsp-indexer` with block ordering changes

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

New Docker image released to `ghcr.io/chillwhales/lsp-indexer` with block ordering changes

## Validated

### OPS-03 — Recovery procedure documented and tested

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S30
- Validation: 6-step recovery procedure in BACKUP.md, restore.sh with interactive confirmation and drop/recreate, manage.sh backup-restore with service orchestration

Recovery procedure documented and tested

### MNTR-01 — Grafana dashboard displays all structured log output from the indexer

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S25
- Validation: Grafana Log Explorer panel with Alloy collecting all indexer container logs to Loki; structured fields queryable by step/handler/component

Grafana dashboard displays all structured log output from the indexer

### MNTR-02 — Grafana dashboard displays Subsquid processor (sqd) logs

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S25
- Validation: Alloy collects ALL Docker container logs including sqd processor output; Log Explorer and block progress panels surface sqd data

Grafana dashboard displays Subsquid processor (sqd) logs

### OPS-01 — PostgreSQL backup strategy defined and documented

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S30
- Validation: docs/docker/BACKUP.md contains complete strategy — pg_dump rationale, schedule config, retention policy, troubleshooting table

PostgreSQL backup strategy defined and documented

### OPS-02 — Backup automation configured (scheduled dumps or WAL archiving)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S30
- Validation: Backup sidecar in docker-compose.prod.yml runs pg_dump via cron (BACKUP_SCHEDULE), configurable retention (BACKUP_RETENTION_DAYS), backup-data volume for persistent storage

Backup automation configured (scheduled dumps or WAL archiving)

### DOCK-01 — Production docker-compose pulls `ghcr.io/chillwhales/lsp-indexer:latest` and runs indexer + PostgreSQL + Hasura

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Production docker-compose pulls `ghcr.io/chillwhales/lsp-indexer:latest` and runs indexer + PostgreSQL + Hasura

### DOCK-02 — Local docker-compose (existing) remains the default for development

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Local docker-compose (existing) remains the default for development

### DOCK-03 — Production compose is configurable via environment variables (RPC URL, DB credentials, Hasura secrets)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Production compose is configurable via environment variables (RPC URL, DB credentials, Hasura secrets)

### BORD-01 — Every TypeORM entity has `blockNumber`, `transactionIndex`, and `logIndex` columns

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Every TypeORM entity has `blockNumber`, `transactionIndex`, and `logIndex` columns

### BORD-02 — All EventPlugins populate block/tx/log fields from the decoded event context

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All EventPlugins populate block/tx/log fields from the decoded event context

### BORD-03 — All EntityHandlers populate block/tx/log fields from the triggering event

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All EntityHandlers populate block/tx/log fields from the triggering event

### BORD-04 — UniversalProfile, DigitalAsset, and NFT entities retain block/tx/log from the oldest (first) event — later updates do not overwrite these fields

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

UniversalProfile, DigitalAsset, and NFT entities retain block/tx/log from the oldest (first) event — later updates do not overwrite these fields

### BORD-05 — schema.graphql updated with block ordering fields on all entities

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

schema.graphql updated with block ordering fields on all entities

### BORD-06 — TypeORM codegen rebuilt and all entities compile cleanly

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

TypeORM codegen rebuilt and all entities compile cleanly

### MNTR-03 — Monitoring stack (Grafana + log collector) included in production docker-compose

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Monitoring stack (Grafana + log collector) included in production docker-compose

### SORT-01 — All 12 query domain services support sorting by oldest and newest based on blockNumber, transactionIndex, logIndex

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All 12 query domain services support sorting by oldest and newest based on blockNumber, transactionIndex, logIndex

### SORT-02 — All 12 subscription hooks support oldest/newest sort order

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All 12 subscription hooks support oldest/newest sort order

### SORT-03 — All 12 React hooks support oldest/newest sort order parameter

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All 12 React hooks support oldest/newest sort order parameter

### SORT-04 — All 12 Next.js server actions support oldest/newest sort order parameter

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All 12 Next.js server actions support oldest/newest sort order parameter

### SORT-05 — Sort parameter propagates through types, documents, parsers, and services

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Sort parameter propagates through types, documents, parsers, and services

### RELP-01 — All 4 packages (`types`, `node`, `react`, `next`) released with sorting support

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All 4 packages (`types`, `node`, `react`, `next`) released with sorting support

### VERS-01 — `@chillwhales/abi` package.json version set to 0.1.0

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`@chillwhales/abi` package.json version set to 0.1.0

### VERS-02 — `@chillwhales/typeorm` package.json version set to 0.1.0

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`@chillwhales/typeorm` package.json version set to 0.1.0

### VERS-03 — `@chillwhales/indexer` package.json version set to 0.1.0

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`@chillwhales/indexer` package.json version set to 0.1.0

### VERS-04 — `apps/test` package.json version set to 0.1.0

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`apps/test` package.json version set to 0.1.0

### SLOG-01 — All `console.*` calls in indexer source migrated to structured Subsquid logger output, except worker threads where logger is unavailable, with queryable fields

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All `console.*` calls in indexer source migrated to structured Subsquid logger output, except worker threads where logger is unavailable, with queryable fields

### SLOG-02 — All `JSON.stringify()` anti-pattern log calls converted to proper `(attrs, message)` pattern

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All `JSON.stringify()` anti-pattern log calls converted to proper `(attrs, message)` pattern

### SLOG-03 — All template string log messages in `metadataFetch.ts` converted to structured attrs

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All template string log messages in `metadataFetch.ts` converted to structured attrs

### SLOG-04 — All startup logs in `app/index.ts` include structured metadata fields

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All startup logs in `app/index.ts` include structured metadata fields

### INST-01 — Every pipeline step (EXTRACT through RESOLVE) emits timing data (`durationMs`)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Every pipeline step (EXTRACT through RESOLVE) emits timing data (`durationMs`)

### INST-02 — Batch summary log emitted at end of `processBatch()` with block range, entity counts, step timings, total elapsed

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Batch summary log emitted at end of `processBatch()` with block range, entity counts, step timings, total elapsed

### INST-03 — EXTRACT and HANDLE steps have dedicated loggers (currently silent)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

EXTRACT and HANDLE steps have dedicated loggers (currently silent)

### DASH-01 — Dashboard includes pipeline step latency panel (per-step timing breakdown)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dashboard includes pipeline step latency panel (per-step timing breakdown)

### DASH-02 — Dashboard includes entity throughput panel (entities persisted per batch by type)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dashboard includes entity throughput panel (entities persisted per batch by type)

### DASH-03 — Dashboard includes verification health panel (valid/invalid/new counts)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dashboard includes verification health panel (valid/invalid/new counts)

### DASH-04 — Dashboard includes metadata fetch progress panel (backlog depth, fetch duration, success/failure)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dashboard includes metadata fetch progress panel (backlog depth, fetch duration, success/failure)

### DASH-05 — Dashboard includes batch processing time panel (total elapsed per batch)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Dashboard includes batch processing time panel (total elapsed per batch)

### LSP29-01 — `@chillwhales/lsp29` installed as indexer dependency and hand-rolled `src/constants/lsp29.ts` deleted

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`@chillwhales/lsp29` installed as indexer dependency and hand-rolled `src/constants/lsp29.ts` deleted

### LSP29-02 — TypeORM `schema.graphql` entities redesigned for v2.0.0 spec (provider-first encryption, per-backend chunks, encryption params entity replaces access control conditions)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

TypeORM `schema.graphql` entities redesigned for v2.0.0 spec (provider-first encryption, per-backend chunks, encryption params entity replaces access control conditions)

### LSP29-03 — TypeORM codegen rebuilt and all generated entity classes compile cleanly

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

TypeORM codegen rebuilt and all generated entity classes compile cleanly

### LSP29-04 — `lsp29EncryptedAsset.handler.ts` imports data keys from `@chillwhales/lsp29` package (no hand-rolled constants)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`lsp29EncryptedAsset.handler.ts` imports data keys from `@chillwhales/lsp29` package (no hand-rolled constants)

### LSP29-05 — `lsp29EncryptedAssetFetch.handler.ts` uses `isLsp29Asset()` type guard from package for JSON validation (no hand-rolled type guards/extractors)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`lsp29EncryptedAssetFetch.handler.ts` uses `isLsp29Asset()` type guard from package for JSON validation (no hand-rolled type guards/extractors)

### LSP29-06 — All hand-rolled LSP29 type guards and extractors removed from `src/utils/index.ts`

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

All hand-rolled LSP29 type guards and extractors removed from `src/utils/index.ts`

### LSP29-07 — `types` package `encrypted-assets.ts` Zod schemas match new entity structure (encryption, chunks, params)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`types` package `encrypted-assets.ts` Zod schemas match new entity structure (encryption, chunks, params)

### LSP29-08 — `node` package GraphQL documents, parsers, and service rewritten for new Hasura schema

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`node` package GraphQL documents, parsers, and service rewritten for new Hasura schema

### LSP29-09 — `react` hooks and `next` server actions compile with breaking type changes

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

`react` hooks and `next` server actions compile with breaking type changes

### LSP29-10 — Full monorepo builds successfully (`pnpm build`)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Full monorepo builds successfully (`pnpm build`)

## Deferred

## Out of Scope
