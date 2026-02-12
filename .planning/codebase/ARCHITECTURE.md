# Architecture

**Analysis Date:** 2026-02-12

## Pattern Overview

**Overall:** Event-Driven Batch Processor with Plugin Architecture (Subsquid EVM Indexer)

**Key Characteristics:**
- Blockchain event log scanner that processes EVM logs in batches via `@subsquid/evm-processor`
- **V2 indexer** is the active version: plugin-based architecture with 6-step enrichment queue pipeline
- **V1 indexer** is legacy: monolithic scan→verify→populate→persist approach (still present but superseded)
- Monorepo with four packages: `abi` (contract types), `typeorm` (schema/models), `indexer` (v1), `indexer-v2` (v2)
- GraphQL API served by Hasura on top of PostgreSQL, auto-configured from the TypeORM schema
- Entity model maps to LUKSO LSP standards (LSP0, LSP3, LSP4, LSP5, LSP6, LSP7, LSP8, LSP12, LSP26, LSP29) plus Chillwhales-specific entities

## Layers

**ABI Layer (`packages/abi`):**
- Purpose: Provide typed ABI definitions for all smart contracts the indexer listens to
- Location: `packages/abi/`
- Contains: Generated TypeScript ABI bindings from Solidity contract artifacts and custom JSON ABIs
- Depends on: `@subsquid/evm-abi`, `@subsquid/evm-codec`, LUKSO contract packages (`@lukso/lsp*-contracts`)
- Used by: `packages/indexer`, `packages/indexer-v2` (imports as `@chillwhales/abi`)
- Code generation: `packages/abi/scripts/codegen.sh` runs `squid-evm-typegen`

**Data Model Layer (`packages/typeorm`):**
- Purpose: Define the database schema and generate TypeORM entity classes
- Location: `packages/typeorm/`
- Contains: GraphQL schema (`schema.graphql`) that drives TypeORM entity code generation via `squid-typeorm-codegen`
- Depends on: `@subsquid/typeorm-store`, `@subsquid/typeorm-codegen`
- Used by: `packages/indexer`, `packages/indexer-v2` (imports as `@chillwhales/typeorm`)
- Code generation: `pnpm codegen` generates TypeORM entities from `schema.graphql`
- Also handles: Hasura metadata generation and DB migrations

**Indexer V2 Core Layer (`packages/indexer-v2`) — ACTIVE:**
- Purpose: Listen to LUKSO blockchain events, process them via plugin architecture, persist structured data
- Location: `packages/indexer-v2/`
- Contains: Plugin-based event extraction, handler-based derived entity creation, 6-step pipeline, worker pool
- Depends on: `@chillwhales/abi`, `@chillwhales/typeorm`, `@subsquid/evm-processor`, `viem`, `axios`, `pino`
- Key innovation: Auto-discovery of plugins and handlers from filesystem conventions

**Indexer V1 Legacy Layer (`packages/indexer`) — LEGACY:**
- Purpose: Original indexer with monolithic pipeline
- Location: `packages/indexer/`
- Contains: Scanner-based event routing, manual entity population, sequential handlers
- Status: Still functional but superseded by V2

**Infrastructure Layer:**
- Purpose: Deployment and data serving
- Location: `docker/v2/` (Docker Compose, Dockerfile), root `docker-compose.yml`
- Contains: PostgreSQL database, Hasura GraphQL Engine, data-connector-agent

## Data Flow — V2 Pipeline (6-Step Enrichment Queue)

**Step 1: EXTRACT**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L196-211
- EventPlugins decode events and store base entities in `BatchContext` with null FK references
- Routing: `PluginRegistry.getEventPlugin(topic0)` — O(1) lookup by event topic hash
- Each plugin calls `ctx.addEntity()` and `ctx.queueEnrichment()` for FK resolution

**Step 2: PERSIST RAW**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L218-232
- Batch-inserts all raw event entities with null FKs via `context.store.insert()`
- Seals raw entity types to prevent handlers from adding to them

**Step 3: HANDLE**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L245-261
- EntityHandlers run for each subscribed entity bag key that has entities
- Pre-verification handlers (`postVerification: false`) create derived entities
- Handlers read from `BatchContext`, create new entities, queue enrichment requests
- Handlers are topologically sorted by `dependsOn` declarations

**Step 3.5: CLEAR SUB-ENTITIES**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L269-285
- Processes clear queue for sub-entities needing delete-then-reinsert (e.g., LSP6 permissions)

**Step 4: PERSIST DERIVED**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L292-339
- Step 4a: DELETE — Removes entities queued for deletion (e.g., zero-balance OwnedAssets)
- Step 4b: UPSERT — Batch-upserts handler-derived entities, with optional merge-upsert
- Merge-upsert: preserves existing non-null values in specified `mergeFields` to prevent data loss across batches

**Step 5: VERIFY**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L348-415
- Batch-verifies addresses via `supportsInterface()` multicalls
- 3-level error fallback: parallel → per-batch → per-address
- LRU cache (50K entries) avoids redundant on-chain calls across batches
- Creates core entities (UniversalProfile, DigitalAsset) for newly verified addresses

**Step 5.5: POST-VERIFICATION HANDLERS**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L423-447
- Handlers with `postVerification: true` run after core entities are persisted
- Used by handlers that need verified entity data (e.g., decimals)

**Step 6: ENRICH**
- Source: `packages/indexer-v2/src/core/pipeline.ts` L449-498
- Batch updates FK fields on already-persisted entities
- Groups requests by (entityType, entityId) for efficient upserts
- Only updates entities that have at least one valid FK enrichment

**State Management:**
- All persistent state is in PostgreSQL via `context.store` (Subsquid's TypeORM store adapter)
- Per-batch state: `BatchContext` — new instance for each batch, no carryover
- Cross-batch state: `VerificationCache` — LRU cache persists across batches (in-memory)
- Worker pool state: queue + in-flight + retry tracking (in-memory)

## Key Abstractions

**EventPlugin Interface:**
- Purpose: Handles a specific blockchain event type by topic0
- Location: `packages/indexer-v2/src/core/types/plugins.ts`
- Pattern: Each plugin file exports a default object implementing `EventPlugin`
- Properties: `name`, `topic0`, `contractFilter?`, `requiresVerification`, `extract(log, block, ctx)`
- Adding a new event = creating 1 file in `packages/indexer-v2/src/plugins/events/`

**EntityHandler Interface:**
- Purpose: Creates derived entities from raw event data
- Location: `packages/indexer-v2/src/core/types/handler.ts`
- Pattern: Each handler file exports a default object implementing `EntityHandler`
- Properties: `name`, `listensToBag[]`, `postVerification?`, `dependsOn?[]`, `handle(hctx, triggeredBy)`
- Adding a new handler = creating 1 file in `packages/indexer-v2/src/handlers/`

**BatchContext:**
- Purpose: Shared entity bag for a single batch; replaces 60+ destructured Maps from V1
- Location: `packages/indexer-v2/src/core/batchContext.ts`
- Interface: `packages/indexer-v2/src/core/types/batchContext.ts`
- Operations: `addEntity()`, `getEntities<T>()`, `queueEnrichment<T>()`, `queueClear<T>()`, `queueDelete<T>()`, `setPersistHint<T>()`
- All type-safe: generic parameters validate FK field names and writable fields at compile time

**PluginRegistry:**
- Purpose: Auto-discovers plugins/handlers from filesystem, validates, routes, sorts
- Location: `packages/indexer-v2/src/core/registry.ts`
- Discovery: Scans `*.plugin.js` and `*.handler.js` files, validates interface compliance
- Routing: `getEventPlugin(topic0)` — O(1) Map lookup
- Ordering: Topological sort of handlers via Kahn's algorithm on `dependsOn` graph

**MetadataWorkerPool:**
- Purpose: Parallel metadata fetching via worker threads
- Location: `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- Worker: `packages/indexer-v2/src/core/metadataWorker.ts`
- Architecture: Queue-based — workers continuously pull work from shared queue
- Features: Exponential backoff retries, worker crash recovery (max 3 restarts), concurrent batch merging

**Verification System:**
- Purpose: Verify blockchain addresses as UniversalProfile or DigitalAsset via `supportsInterface()`
- Location: `packages/indexer-v2/src/core/verification.ts`
- Strategy: LRU cache → DB lookup → Multicall3 on-chain check
- Multicall: `packages/indexer-v2/src/core/multicall.ts` — batched `eth_call` via Multicall3 contract

**MetadataFetch Utility:**
- Purpose: Shared utility for LSP3/LSP4/LSP29 metadata fetch handlers
- Location: `packages/indexer-v2/src/utils/metadataFetch.ts`
- Pattern: 3-tier DB backlog query (never-fetched → retryable HTTP → retryable network)
- Head-only: Only fetches metadata when indexer is at chain head (`isHead === true`)

## Entry Points

**V2 Indexer Runtime (PRIMARY):**
- Location: `packages/indexer-v2/src/app/index.ts` (compiled: `packages/indexer-v2/lib/app/index.js`)
- Triggers: `pnpm start:v2` from root
- Responsibilities: Initialize file logger, bootstrap registry, configure processor subscriptions, create pipeline config, start `processor.run()`
- Bootstrap: `packages/indexer-v2/src/app/bootstrap.ts` — creates `PluginRegistry`, discovers plugins and handlers
- Config: `packages/indexer-v2/src/app/config.ts` — creates `PipelineConfig` with registry, verify function, worker pool

**V1 Indexer Runtime (LEGACY):**
- Location: `packages/indexer/src/app/index.ts` (compiled: `packages/indexer/lib/app/index.js`)
- Triggers: `pnpm start` from root

**Processor Configuration:**
- Location: `packages/indexer-v2/src/app/processor.ts`
- Responsibilities: Configures `EvmBatchProcessor` with Subsquid gateway, RPC endpoint, field selection
- Log subscriptions are added dynamically by the registry at runtime (not hardcoded)

## Error Handling

**Strategy:** No try/catch in pipeline — errors propagate to Subsquid framework. Best-effort for metadata fetching.

**Patterns:**
- **Pipeline errors**: A failed store operation halts the pipeline for the batch (Subsquid retries the batch)
- **Multicall verification**: 3-level fallback — parallel → per-batch → per-address
- **Metadata fetching**: Track `fetchErrorMessage`, `fetchErrorCode`, `fetchErrorStatus`, `retryCount` per entity. Retryable HTTP errors (408, 429, 5xx) and network errors (ETIMEDOUT, EPROTO) are retried up to `FETCH_RETRY_COUNT` times
- **Worker crashes**: Workers auto-restart up to 3 times; in-flight requests re-queued without retry count increment
- **Event decoding**: No try/catch around `decode()` — ABI mismatch crashes the process (by design)
- **Data URL parsing**: Returns structured error objects; does not throw

## Concurrency Model

**Worker Pool:**
- 4 worker threads (configurable via `METADATA_WORKER_POOL_SIZE`)
- Queue-based: workers pull `WORKER_BATCH_SIZE` (250) requests from shared queue
- Exponential backoff for retries: `1000ms * 2^attempt`
- Concurrent `fetchBatch()` calls merge into the shared queue

**Pipeline:**
- Single-threaded pipeline execution (no parallelism between steps)
- Parallel verification of UP and DA categories within Step 5
- Sequential handler execution within Step 3 (topologically sorted)

**Batch Processing:**
- Subsquid framework controls batch boundaries
- Each batch creates a fresh `BatchContext` — no state carryover (except LRU cache)

## Cross-Cutting Concerns

**Logging:**
- Dual-output: Subsquid's `context.log` (stdout) + pino file logger (rotating JSON)
- Structured attributes: `{ step, blockRange, entityType, count }` — no JSON.stringify
- File logger: daily rotation via `pino-roll`, configurable via `LOG_LEVEL`, `INDEXER_ENABLE_FILE_LOGGER`
- Component loggers: `createComponentLogger()` for handler-level tagging
- Step loggers: `createStepLogger()` for pipeline step identification

**Validation:**
- On-chain interface verification via `supportsInterface()` + Multicall3
- Entity type validation at plugin/handler discovery time (type guards)
- Compile-time FK field validation via generic type parameters (`FKFields<T>`, `WritableFields<T>`)
- Null address filtering before enrichment requests (`isNullAddress()`)

**Authentication:**
- Not applicable for the indexer itself (reads public blockchain data)
- Hasura has `HASURA_GRAPHQL_ADMIN_SECRET` for admin and `public` unauthorized role for queries

**ID Generation:**
- Event entities: `uuid v4` for unique IDs
- Core entities (UniversalProfile, DigitalAsset): blockchain address as ID
- Data key entities: address as ID (single latest value per address)
- NFTs: `"{address} - {tokenId}"` format
- OwnedAsset: `"{owner}:{address}"` format
- OwnedToken: `"{owner}:{address}:{tokenId}"` format
- Follow: `"{followerAddress} - {followedAddress}"` format

---

*Architecture analysis: 2026-02-12*
