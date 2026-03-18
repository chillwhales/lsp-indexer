# M001: Migration

**Vision:** The LSP Indexer is an open-source blockchain event indexer for the LUKSO network.

## Success Criteria


## Slices

- [x] **S01: Handler Migration** `risk:medium` `depends:[]`
  > After this: Add infrastructure changes that all Phase 1 handlers depend on: async handler support, a delete queue for DB-level entity removal, a post-verification handler hook (Step 5.
- [x] **S02: New Handlers Structured Logging** `risk:medium` `depends:[S01]`
  > After this: Build the structured logging module that provides consistent JSON log output across all pipeline steps.
- [x] **S03: Metadata Fetch Handlers** `risk:medium` `depends:[S02]`
  > After this: Build the foundation layer for all three metadata fetch handlers: extend FetchResult to preserve error details, port V1 type guards, and create the shared fetch utility.
- [x] **S04: Improve Debug Logging Strategy** `risk:medium` `depends:[S03]`
  > After this: Add component-specific debug logging infrastructure with configurable filtering, enabling faster debugging of worker pool and metadata fetch operations without code modifications.
- [x] **S05: Integration Wiring** `risk:medium` `depends:[S04]`
  > After this: unit tests prove integration-wiring works
- [x] **S06: Deployment Validation** `risk:medium` `depends:[S05]`
  > After this: Build the foundation layer for the V1 vs V2 comparison tool: type definitions, entity registry with all 72 Hasura entity types and known divergence exclusions, and a GraphQL client that can query both aggregate counts and paginated row samples from Hasura endpoints.
- [x] **S07: Pipeline Bug Fix Missing Handlers** `risk:medium` `depends:[S06]`
  > After this: Fix the contract filter address comparison bug in pipeline.
- [x] **S08: Lsp4 Base Uri Count Parity** `risk:medium` `depends:[S07]`
  > After this: Fix OwnedAsset double-processing bug and mark LSP8ReferenceContract as known V1 divergence.
- [x] **S09: Entity Upsert Pattern Standardization** `risk:medium` `depends:[S08]`
  > After this: Create `resolveEntity<T>()` and `resolveEntities<T>()` helpers in handlerHelpers.
- [x] **S10: Tech Debt Cleanup** `risk:medium` `depends:[S09]`
  > After this: Remove stale code artifacts and replace JSON.
- [x] **S11: Package Foundation** `risk:medium` `depends:[S10]`
  > After this: Create the `packages/react` package with working ESM+CJS+DTS builds, GraphQL codegen pipeline, `IndexerError` class with industry-standard error taxonomy, typed GraphQL fetch wrapper, and env-based URL configuration — validated by publint and arethetypeswrong.
- [x] **S12: First Vertical Slice** `risk:medium` `depends:[S11]`
  > After this: Create the Profile domain types and GraphQL documents — the foundation layer that everything else builds on.
- [x] **S13: Digital Assets** `risk:medium` `depends:[S12]`
  > After this: Create the Digital Asset domain types (Zod schemas + inferred TS types) and GraphQL documents — the foundation layer for the entire digital assets vertical slice.
- [x] **S14: Subscription Foundation** `risk:medium` `depends:[S13]`
  > After this: Complete type-safety revamp of subscription infrastructure, export where-clause builders from all 12 domain services, and wire the test app for subscription development.
- [x] **S15: Server Actions Publish Readiness** `risk:medium` `depends:[S14]`
  > After this: Add Zod input validation to all 21 server action functions in `@lsp-indexer/next`, using existing param schemas from `@lsp-indexer/types`.
- [x] **S16: Replace Local Packages With Chillwhales Npm** `risk:medium` `depends:[S15]`
  > After this: Replace local `packages/data-keys/` and `packages/lsp1/` with `@chillwhales/erc725` and `@chillwhales/lsp1` from npm, then validate the full build pipeline.
- [x] **S17: Indexer V1 Cleanup** `risk:medium` `depends:[S16]`
  > After this: Delete all v1 indexer code, rename v2 to canonical, promote Docker files, and update all configs so the repo has a single indexer with zero "v2" suffixes.
- [x] **S18: Code Comments Cleanup Release Prep** `risk:medium` `depends:[S17]`
  > After this: Remove all dead/stale comments from the 4 publishable packages and verify+enhance JSDoc coverage on every public API export — ensuring IDE hover shows concise, consumer-oriented documentation.
- [x] **S19: Ci Cd Workflows Shared Infra** `risk:medium` `depends:[S18]`
  > After this: Set up changesets infrastructure and expand the existing CI workflow from the current 3-job format/lint/build to a full layered pipeline with install → parallel lint/format/build → parallel typecheck/test/pkg-verify → coverage report.
- [x] **S20: V1.1 Verification Gap Closure** `risk:medium` `depends:[S19]`
  > After this: Create VERIFICATION.
- [x] **S21: Version Normalization** `risk:medium` `depends:[S20]`
  > After this: Normalize all private package versions to 0.
- [x] **S22: Production Docker Compose** `risk:medium` `depends:[S21]`
  > After this: Create a production Docker Compose file that pulls the released indexer image from ghcr.
- [x] **S23: Block Ordering** `risk:medium` `depends:[S22]`
  > After this: Add block ordering fields to the schema and type system foundation.
- [x] **S24: Type System Tightening** `risk:medium` `depends:[S23]`
  > After this: Remove unchecked generic type parameter from all `getEntities<T>()` call sites and add explicit `as Map<string, ConcreteType>` casts at the handler level where the concrete type is known.
- [x] **S25: Monitoring Docker Image Release** `risk:medium` `depends:[S24]`
  > After this: Create the complete monitoring infrastructure: config files for Loki, Alloy, Prometheus, and Grafana provisioning, then add all 5 monitoring services to the production docker-compose with environment variable support.
- [x] **S26: Structured Logging Overhaul** `risk:medium` `depends:[S25]`
  > After this: Establish structured logging conventions and migrate core infrastructure (registry, config, startup) from console.
- [x] **S27: Pipeline Instrumentation** `risk:medium` `depends:[S26]`
  > After this: Add performance timing to every pipeline step and emit a batch summary log at the end of processBatch().
- [x] **S28: Grafana Dashboard Redesign** `risk:medium` `depends:[S27]`
  > After this: Add 5 new panel groups to the Grafana dashboard that surface pipeline health, entity throughput, verification status, and metadata fetch progress using structured log data from Phases 20.
- [x] **S29: Sorting Consumer Package Release** `risk:medium` `depends:[S28]`
  > After this: Add consistent `newest`/`oldest` block-order sorting across all 12 domain types and services.
- [ ] ~~**S30: Database Operations — Backup strategy, automation, and recovery procedure** `risk:medium` `depends:[S29]`~~
  > **Deferred** — VPS/volume-level snapshots cover the backup need; a pg_dump sidecar adds complexity without benefit. M001 marked complete without S30.
