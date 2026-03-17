# S26: Structured Logging Overhaul

**Goal:** Establish structured logging conventions and migrate core infrastructure (registry, config, startup) from console.
**Demo:** Establish structured logging conventions and migrate core infrastructure (registry, config, startup) from console.

## Must-Haves


## Tasks

- [x] **T01: 20.1-structured-logging-overhaul 01** `est:4min`
  - Establish structured logging conventions and migrate core infrastructure (registry, config, startup) from console.* / bare string logs to structured `(attrs, message)` pattern.

Purpose: Foundation for Grafana/Loki queryability — all bootstrap and registry logs become filterable by step, component, plugin/handler name.
Output: LOGGING.md reference + zero console.* calls in registry/config/startup files.
- [x] **T02: 20.1-structured-logging-overhaul 02** `est:7min`
  - Migrate all remaining unstructured log calls in handlers, utilities, and worker threads to the structured `(attrs, message)` pattern.

Purpose: Eliminates the last JSON.stringify anti-pattern, template string logs, and console.* calls — completing the structured logging migration for Grafana/Loki queryability.
Output: Zero JSON.stringify in log args, zero template string logs in metadataFetch, worker logs relayed through parent.

## Files Likely Touched

- `packages/indexer/LOGGING.md`
- `packages/indexer/src/core/registry.ts`
- `packages/indexer/src/app/bootstrap.ts`
- `packages/indexer/src/app/config.ts`
- `packages/indexer/src/app/index.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer/src/handlers/totalSupply.handler.ts`
- `packages/indexer/src/utils/metadataFetch.ts`
- `packages/indexer/src/core/metadataWorker.ts`
- `packages/indexer/src/core/metadataWorkerPool.ts`
