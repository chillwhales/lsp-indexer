# Codebase Concerns

**Analysis Date:** 2026-02-12

## Summary

This document covers the LSP Indexer project with two parallel codebases:

- **V1 (legacy):** `packages/indexer/` - 7,986 lines, zero tests, active in production
- **V2 (rewrite):** `packages/indexer-v2/` - 9,892 lines source + 5,637 lines tests, Phase 3.1 complete

V2 is designed to replace V1. The migration is ~86% complete (25/29 requirements). Remaining: Phase 3.2 (Queue-Based Worker Pool) and Phase 5 (Deployment and Validation).

---

## Tech Debt

### [Critical] V1 Missing `break` Statements in Scanner Switch/Case

- Issue: Four `case` blocks in `scanLogs` are missing `break` statements, causing fall-through
  - `LSP4Creators[].length` (line 203) falls through to `LSP5ReceivedAssets[].length`
  - `LSP5ReceivedAssets[].length` (line 209) falls through to `AddressPermissions[].length`
  - `AddressPermissions[].length` (line 218) falls through to `LSP8ReferenceContract`
  - `LSP12IssuedAssets[].length` (line 247) falls through to `default`
- Files: `packages/indexer/src/app/scanner.ts` (lines 203-254)
- Impact: Every LSP4 Creators length event also creates LSP5, LSP6, and LSP8 entities incorrectly. Database contains phantom entities.
- Fix approach: Add `break;` after each case block. V2 eliminates this pattern entirely with plugin-based routing.

### [Critical] V1 Has Zero Test Coverage

- Issue: The entire `packages/indexer/` package (7,986 lines) has no test files whatsoever.
- Files: All files under `packages/indexer/src/`
- Impact: Cannot safely modify V1 code. The switch fall-through bug above went undetected. Any production hotfix is high-risk.
- Fix approach: Complete V2 migration (which has tests) rather than retroactively adding V1 tests.

### [High] V2 TypeScript Strict Mode Not Enabled in indexer-v2

- Issue: `packages/indexer-v2/tsconfig.json` does not set `strict: true`. The root `tsconfig.json` has `strict: true` but indexer-v2 has its own tsconfig that does not inherit it.
- Files: `packages/indexer-v2/tsconfig.json`
- Impact: No `strictNullChecks`, no `noImplicitAny` enforcement. Type safety gaps that could cause runtime errors. The codebase uses `as Record<string, unknown>` casts in pipeline.ts (lines 127-128, 154) which would be caught by stricter settings.
- Fix approach: Add `"strict": true` to `packages/indexer-v2/tsconfig.json` and fix resulting type errors.

### [High] V1 God Functions and Massive Parameter Lists

- Issue: `scanLogs` (724 lines), `populateEntities` (462 lines), and `index.ts` (542 lines) are monolithic functions with 40+ destructured parameters.
- Files: `packages/indexer/src/app/scanner.ts`, `packages/indexer/src/utils/entityPopulation.ts`, `packages/indexer/src/app/index.ts`
- Impact: Adding any new LSP standard requires modifying 4+ files in lockstep. High cognitive load, error-prone.
- Fix approach: Complete V2 migration. V2 uses plugin/handler registry pattern that isolates each event type.

### [Medium] No Graceful Shutdown for Worker Pool

- Issue: `MetadataWorkerPool.shutdown()` exists but is never called from the application entry point (`packages/indexer-v2/src/app/index.ts`). No SIGTERM/SIGINT handler is registered.
- Files: `packages/indexer-v2/src/app/index.ts`, `packages/indexer-v2/src/app/config.ts`
- Impact: On container restart or deployment, worker threads may be killed mid-fetch, leaving metadata entities in an inconsistent state (partially fetched, no error recorded).
- Fix approach: Add process signal handlers in `index.ts` that call `workerPool.shutdown()` before exit.

### [Medium] Duplicate Type Definitions in Worker Thread

- Issue: `metadataWorker.ts` duplicates `FetchRequest` and `FetchResult` interfaces because worker threads cannot share imports with the parent process easily.
- Files: `packages/indexer-v2/src/core/metadataWorker.ts` (lines 51-67)
- Impact: If the types diverge between parent and worker, silent data corruption. Currently 3 fields differ (`retryable` added in worker version).
- Fix approach: Extract shared types to a plain `.ts` file that can be compiled independently, or use a shared JSON schema.

### [Medium] V1 Spin-Wait Polling for Async Completion

- Issue: V1 metadata handlers use `while (...) { await Utils.timeout(1000); }` to wait for fire-and-forget promises.
- Files: `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts`, `packages/indexer/src/app/handlers/lsp4MetadataHandler.ts`, `packages/indexer/src/app/handlers/lsp29EncryptedAssetHandler.ts`
- Impact: Minimum 1-second latency per batch. If any promise rejects without incrementing counter, infinite hang.
- Fix approach: V2 replaces this with `MetadataWorkerPool.fetchBatch()` + `Promise.race()` timeout. Not an issue once V2 is deployed.

### [Low] TODO Comments Requiring Follow-up

- `packages/indexer-v2/src/core/registry.ts` line 125: `TODO: Wire this into bootstrap in Phase 6 (issue #58)`
- `packages/indexer-v2/test/integration/pipeline.test.ts` line 272: `TODO: Document V1's complete handler execution order`
- `decimals.handler.ts` and `formattedTokenId.handler.ts` need logging updates (noted in STATE.md discovered todos)
- Fix approach: Address during Phase 5 (Deployment and Validation).
---

## Security Considerations

### [Medium] No SSRF Protection on Metadata URL Fetching

- Risk: The indexer fetches arbitrary URLs from on-chain data. Attackers can set malicious URLs in contract data keys targeting internal services.
- Files: `packages/indexer-v2/src/core/metadataWorker.ts` (line 131 - `httpClient.get`), `packages/indexer/src/utils/index.ts`
- Current mitigation: Only `data:`, `ipfs://`, and `http(s)://` URLs are handled. No private IP range blocking.
- Recommendations: Add URL allowlist/blocklist. Reject private IP ranges (10.x, 172.16-31.x, 192.168.x). Limit response sizes.

### [Medium] Default Credentials in Docker Configuration

- Risk: `docker/v2/docker-compose.yml` uses `POSTGRES_PASSWORD=postgres` as default. `.env.example` has `POSTGRES_PASSWORD=postgres`.
- Files: `docker/v2/docker-compose.yml` (line 63), `.env.example` (line 7)
- Current mitigation: Documented as examples. `HASURA_GRAPHQL_ADMIN_SECRET` uses `:?` syntax to require explicit setting.
- Recommendations: Add startup validation that rejects default `POSTGRES_PASSWORD=postgres` in production (`NODE_ENV=production`).

### [Low] Hasura Dev Mode Enabled by Default

- Risk: `HASURA_GRAPHQL_DEV_MODE=true` is the default in docker-compose, which exposes detailed error messages.
- Files: `docker/v2/docker-compose.yml` (line 186)
- Current mitigation: None.
- Recommendations: Set `HASURA_GRAPHQL_DEV_MODE=false` when `NODE_ENV=production`.

---

## Performance Concerns

### [High] Batch-Wait Worker Pool Pattern (Scheduled for Phase 3.2)

- Problem: `MetadataWorkerPool` uses queue-based architecture but `metadataFetch.ts` processes batches sequentially with `Promise.race()` timeout per batch.
- Files: `packages/indexer-v2/src/utils/metadataFetch.ts` (lines 272-327), `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- Cause: `FETCH_BATCH_SIZE` default is 100 (reduced from 1000 due to hangs per comment on line 34-35 of constants). Sequential batch loop means workers idle between batches.
- Improvement path: Phase 3.2 plans to optimize. The worker pool already has queue-based internals; the bottleneck is the sequential for-loop in `metadataFetch.ts`.

### [Medium] V1 Sequential Handler Execution

- Problem: All V1 post-processing handlers run sequentially with `await`. Independent handlers like `lsp3ProfileHandler`, `lsp4MetadataHandler`, `lsp29EncryptedAssetHandler` could run in parallel.
- Files: `packages/indexer/src/app/index.ts` (lines 481-541)
- Improvement path: V2 pipeline handles this via the 6-step architecture. Not worth fixing in V1.

### [Medium] In-Memory Entity Accumulation

- Problem: Both V1 and V2 accumulate all entities for a batch in memory before persisting.
- Files: `packages/indexer-v2/src/core/batchContext.ts`, `packages/indexer/src/app/scanner.ts`
- Cause: Pipeline requires all entities to be available for verification and FK enrichment.
- Improvement path: Subsquid controls batch sizes. Monitor memory usage in production. Consider streaming persistence for very large batches if needed.

### [Low] LRU Cache Size Fixed at 50,000

- Problem: Verification cache uses a fixed 50,000 entry LRU. On LUKSO mainnet with potentially millions of addresses, the hit rate may degrade over time.
- Files: `packages/indexer-v2/src/core/verification.ts` (line 98)
- Improvement path: Make configurable via env var. Monitor cache hit rate in production.

---

## Reliability Concerns

### [High] No Pipeline-Level Error Recovery

- Problem: `processBatch` in `pipeline.ts` has no try/catch. Comment on line 174 states: "No try/catch - errors propagate to the Subsquid framework." A single failed store operation halts the entire batch.
- Files: `packages/indexer-v2/src/core/pipeline.ts` (line 177)
- Impact: A transient DB error in any of the 6 steps causes the entire batch to fail and retry from scratch. Metadata fetches (which may have taken minutes) are wasted.
- Fix approach: Consider wrapping metadata fetch results in a side-channel so they survive batch retries, or add selective error handling around non-critical steps.

### [Medium] setTimeout-Based Retry in Worker Pool

- Problem: `scheduleRetry` uses `setTimeout` for exponential backoff (line 429). If the event loop is blocked or the pool shuts down during a timeout, retries may fire after shutdown.
- Files: `packages/indexer-v2/src/core/metadataWorkerPool.ts` (lines 405-439)
- Current mitigation: Line 431 checks `if (this.isShutdown) return;` before re-queuing. But timers are not cancelled on shutdown.
- Fix approach: Track active timers and clear them in `shutdown()`.

### [Medium] Worker Crash Recovery Has Finite Restarts

- Problem: `PoolWorker.maxRestarts = 3`. After 3 crashes, worker is permanently dead. With 4 workers, if 3 die, throughput drops 75%.
- Files: `packages/indexer-v2/src/core/metadataWorkerPool.ts` (lines 69, 141-153)
- Impact: No way to recover dead workers short of restarting the entire process.
- Fix approach: Consider resetting restart count periodically (e.g., after successful batch), or making `maxRestarts` configurable.

### [Low] Empty catch Blocks in V2 Verification

- Problem: `verification.ts` uses bare `catch {}` blocks (lines 200, 205, 216) in the 3-level multicall fallback.
- Files: `packages/indexer-v2/src/core/verification.ts` (lines 200-222)
- Impact: Errors are silently swallowed. Difficult to diagnose RPC issues.
- Fix approach: Add debug-level logging inside catch blocks for observability.

---

## Architecture Concerns

### [High] V1 and V2 Coexist Without Clear Boundary

- Problem: Both `packages/indexer/` (V1) and `packages/indexer-v2/` (V2) exist simultaneously. They share `packages/abi/` and `packages/typeorm/`. CI builds V2 only but V1 is still the production code.
- Files: `packages/indexer/`, `packages/indexer-v2/`, `.github/workflows/ci.yml`
- Impact: Confusion about which codebase is authoritative. Risk of accidentally modifying V1 when V2 should be changed.
- Fix approach: Phase 5 (Deployment and Validation) will run both side-by-side and validate parity. After that, remove V1.

### [Medium] Registry Uses Dynamic `require()` for Plugin Discovery

- Problem: `PluginRegistry.discover()` and `discoverHandlers()` use `require(file)` to dynamically load compiled JS files at runtime.
- Files: `packages/indexer-v2/src/core/registry.ts` (lines 89, 135)
- Impact: No compile-time verification of plugin contracts. Invalid modules are silently skipped with `console.warn`. Missing plugins would only be detected at runtime.
- Fix approach: Consider explicit registration in bootstrap as a safety check, or add a startup validation step that verifies expected plugin count.

### [Medium] Marketplace Handlers Only in V1

- Problem: V2 has no marketplace event plugins or handlers. The V1 marketplace handler (`marketplaceHandler.ts`, 310 lines) covers ListingCreated, ListingClosed, PurchaseCompleted, etc.
- Files: `packages/indexer/src/app/handlers/marketplaceHandler.ts`, `packages/indexer/src/utils/marketplace/index.ts`
- Impact: V2 cannot replace V1 in production until marketplace events are ported.
- Fix approach: Create V2 marketplace EventPlugins and EntityHandlers. This may need a new phase or be part of Phase 5.

---

## Test Coverage Gaps

### [Critical] V1 Package: Zero Tests

- What is not tested: All event scanning, entity extraction, verification, population, metadata fetching, database persistence, handler logic.
- Files: All files under `packages/indexer/src/` (7,986 lines)
- Risk: The switch fall-through bug demonstrates critical logic errors go undetected.
- Priority: Critical - but fix is V2 migration, not adding V1 tests.

### [High] V2 Handler Coverage: 15 of 22 Handlers Untested

- What is not tested: 15 handlers have no dedicated test files:
  - `decimals.handler.ts`, `formattedTokenId.handler.ts`, `nft.handler.ts`
  - `lsp3Profile.handler.ts`, `lsp4Metadata.handler.ts`, `lsp4TokenName.handler.ts`
  - `lsp4TokenSymbol.handler.ts`, `lsp4TokenType.handler.ts`, `lsp4Creators.handler.ts`
  - `lsp5ReceivedAssets.handler.ts`, `lsp8ReferenceContract.handler.ts`
  - `lsp8TokenIdFormat.handler.ts`, `lsp8MetadataBaseURI.handler.ts`
  - `lsp12IssuedAssets.handler.ts`, `lsp29EncryptedAsset.handler.ts`
- Files: `packages/indexer-v2/src/handlers/` (15 files without corresponding test files)
- Risk: Handler logic errors (FK wiring, enrichment queuing, entity construction) would go undetected.
- Priority: High - these are the data transformation layer.

### [High] V2 Event Plugins: Zero Tests

- What is not tested: All 11 event plugins (dataChanged, executed, follow, lsp7Transfer, lsp8Transfer, etc.)
- Files: `packages/indexer-v2/src/plugins/events/` (11 plugin files)
- Risk: Event decoding errors would produce wrong entity data. Plugins are the first step in the pipeline.
- Priority: High.

### [Medium] V2 Verification Module: Limited Coverage

- What is not tested: The 3-level multicall fallback path, cache eviction behavior under load, DB lookup path.
- Files: `packages/indexer-v2/src/core/verification.ts` (450 lines)
- Risk: Verification determines which entities are tracked. Incorrect verification means missing data.
- Priority: Medium.

### [Medium] Integration Test Incomplete

- What is not tested: `packages/indexer-v2/test/integration/pipeline.test.ts` has a TODO on line 272 about documenting complete handler execution order.
- Files: `packages/indexer-v2/test/integration/pipeline.test.ts` (457 lines)
- Risk: Handler ordering regressions could cause data inconsistencies.
- Priority: Medium.

---

## Scaling Limits

### [Medium] Single-Process Architecture

- Current capacity: All indexing, verification, and metadata fetching in one Node.js process with worker threads for IPFS fetching.
- Limit: Cannot scale horizontally. Memory-bound by entity accumulation per batch.
- Scaling path: Worker threads already handle parallelism for metadata. For further scale, would need Subsquid's multi-processor support or external queue for metadata.

### [Medium] IPFS Gateway Single Point of Failure

- Current capacity: All metadata fetches go through a single IPFS gateway (`IPFS_GATEWAY` env var, default `https://api.universalprofile.cloud/ipfs/`).
- Limit: If gateway is down or rate-limited, all metadata fetching stops.
- Scaling path: Add fallback gateways. Implement gateway rotation in `metadataWorker.ts`.

---

## Dependencies at Risk

### [Medium] Subsquid SDK Version

- Risk: Using `@subsquid/evm-processor` v1 API. Subsquid has moved to v2+ with breaking changes. The code accesses internal APIs like `context._chain.client.call` in verification.
- Files: `packages/indexer-v2/src/core/multicall.ts`, `packages/indexer-v2/src/app/processor.ts`
- Impact: Cannot upgrade without significant refactoring.
- Migration plan: Follow Subsquid v2 migration guide after V2 production deployment stabilizes.

### [Low] pnpm Version Mismatch Across Packages

- Risk: Root `package.json` specifies different `packageManager` version than sub-packages.
- Files: `package.json`, `packages/indexer/package.json`, `packages/typeorm/package.json`, `packages/abi/package.json`
- Impact: Corepack may enforce different pnpm versions. Docker uses `--no-frozen-lockfile` (noted in Dockerfile comments).
- Fix approach: Align all `packageManager` fields. Remove `--no-frozen-lockfile` from Docker builds.

---

## Missing Critical Features

### [High] No Health Checks or Monitoring Metrics

- Problem: No Prometheus metrics, no health endpoint beyond Docker's process check (`pgrep`). The Docker healthcheck only verifies the process is running, not that it is making progress.
- Files: `docker/v2/Dockerfile` (line 122), `docker/v2/docker-compose.yml` (lines 100-105)
- Blocks: Cannot detect stalled indexing, RPC rate limiting, or metadata fetch backlogs in production.
- Fix approach: Add a health HTTP endpoint that reports last processed block number and timestamp. Export Prometheus metrics for worker pool throughput, queue depth, and error rates.

### [High] No Automated V1/V2 Data Parity Validation

- Problem: Phase 5 (DEPL-02) requires automated comparison between V1 and V2 database state, but this does not exist yet.
- Files: None (not implemented)
- Blocks: Cannot confidently cut over from V1 to V2 in production.
- Fix approach: Implement as part of Phase 5. Create a comparison script that queries both databases and reports per-table diffs.

### [Medium] CI Does Not Run Tests

- Problem: `.github/workflows/ci.yml` runs format check, lint, and build but does NOT run `pnpm test`. The 12 test files in V2 are never executed in CI.
- Files: `.github/workflows/ci.yml` (91 lines - no test step)
- Blocks: Tests can break without anyone knowing. Regressions are only caught locally.
- Fix approach: Add a `test` job to CI that runs `pnpm --filter=@chillwhales/indexer-v2 test`.

---

_Concerns audit: 2026-02-12_
