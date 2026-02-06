# Features Research

**Domain:** LUKSO Blockchain Event Indexer (LSP Standards)
**Researched:** 2026-02-06
**Mode:** Ecosystem — completing V2 rewrite to production readiness

## Table Stakes

Features users/operators expect. Missing = production indexer is unreliable.

### 1. Error Recovery and Graceful Restart

| Feature                                  | Why Expected                                                                                                                          | Complexity | Notes                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crash recovery from last committed batch | Indexer must resume from where it left off without re-indexing from genesis                                                           | Low        | Subsquid `TypeormDatabase` handles this via its internal `status` table that tracks the last processed block. V1 already has this. V2 inherits it for free. **No custom work needed.**                                                |
| Transient RPC failure retry              | LUKSO RPC is rate-limited (10 req/s default). Network blips, 429s, and timeouts must be retried, not fatal                            | Low        | Subsquid processor has built-in retry for RPC calls. V1's `isRetryableError()` pattern for metadata fetching also handles this. V2 should use `p-limit` or similar instead of the V1 spin-wait pattern.                               |
| Metadata fetch retry with backoff        | IPFS gateways are unreliable. Fetches must retry with exponential backoff, track failure state per entity, and not block the pipeline | Medium     | V1 already tracks `retryCount`, `fetchErrorCode`, `fetchErrorMessage`, `fetchErrorStatus` per metadata entity. V2 should preserve this but replace the fire-and-forget + spin-wait with `Promise.allSettled()` + concurrency limiter. |
| Database connection recovery             | PostgreSQL restarts, connection pool exhaustion, and transient DB errors must not require manual restart                              | Low        | Subsquid's `TypeormDatabase` adapter handles connection pooling. Docker `restart: unless-stopped` provides process-level recovery.                                                                                                    |

### 2. Chain Reorganization Handling

| Feature                     | Why Expected                                                                                       | Complexity | Notes                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finality confirmation depth | Only persist data from blocks with sufficient confirmations to avoid reorg-induced data corruption | Low        | Already configured: `FINALITY_CONFIRMATION=75` (~15 min). Subsquid `EvmBatchProcessor` natively supports `setFinalityConfirmation()`. Data from blocks with fewer confirmations is held as "hot" and automatically rolled back on reorg. **Already handled by framework.**                                                              |
| Hot block rollback support  | When chain reorgs occur, the indexer must automatically undo writes from orphaned blocks           | Low        | Subsquid's `TypeormDatabase` natively supports this with its unfinalized blocks mechanism (documented in Subsquid SDK "RPC ingestion and reorgs"). The processor re-runs the batch handler with consensus data and asks the Database to roll back orphaned state. **No custom work needed beyond setting `setFinalityConfirmation()`.** |

**Confidence: HIGH** — Verified against Subsquid official documentation (https://docs.subsquid.io/sdk/resources/unfinalized-blocks/).

### 3. Data Completeness and Correctness

| Feature                            | Why Expected                                                                                                                                             | Complexity | Notes                                                                                                                                                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Process every event (no data loss) | Blockchain indexers must capture every event in every block. Skipping = permanent data loss                                                              | Low        | Subsquid processor guarantees delivery of all matching logs from configured topics. The risk is in the topic/address configuration, not the framework. V2 must subscribe to the exact same topics as V1.                                                |
| Correct entity verification        | Only valid UniversalProfiles, DigitalAssets, and NFTs should have data indexed. Invalid addresses must not produce phantom entities                      | Medium     | V1 uses batched Multicall3 `supportsInterface()` calls with triple-fallback (batch all -> batch individually -> single calls). V2's enrichment queue approach improves this by persisting raw entities first, then resolving FKs to verified addresses. |
| Head-only metadata fetching        | Metadata (IPFS JSON) should only be fetched when indexer is at chain tip (`context.isHead`). During historical sync, metadata fetching blocks processing | Low        | V1 already guards metadata handlers with `if (context.isHead)`. V2 must preserve this pattern.                                                                                                                                                          |
| Idempotent re-processing           | Re-running the indexer on the same blocks must produce identical state. Upserts not inserts for deterministic entities                                   | Low        | V1 uses `context.store.upsert()` for entities with deterministic IDs (addresses, composite keys). UUID-based event entities use `insert()` which is correct since each event is unique. V2 preserves this.                                              |

### 4. Monitoring and Observability

| Feature                     | Why Expected                                                                                                                                 | Complexity | Notes                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structured logging          | JSON-structured logs with consistent fields (level, timestamp, message, context) parseable by log aggregators                                | Medium     | V1 uses manual `JSON.stringify()` for structured output. V2 should implement a proper structured logging layer. **Recommendation: wrap Subsquid's `context.log` with a thin adapter that adds consistent fields** (batch number, block range, entity counts, duration). Pino is overkill for this use case since Subsquid already provides the logger — just standardize the wrapper. |
| Processing progress metrics | Operators must see: current block, chain head, blocks behind, processing rate (blocks/sec, events/sec)                                       | Low        | Subsquid processor logs progress natively. V2 should add custom counters: entities processed per batch, metadata fetches pending, verification cache hit rate.                                                                                                                                                                                                                        |
| Health indication           | External systems must know if the indexer is alive and processing                                                                            | Medium     | V1 has no health endpoint. V2 should expose at minimum: a way to check if the indexer is processing (e.g., last-processed-block-timestamp within N minutes). Docker health check on process liveness is the baseline. A simple HTTP health endpoint is a differentiator, not table stakes.                                                                                            |
| Error alerting context      | When errors occur, logs must include enough context to diagnose without reproducing (block number, transaction hash, entity ID, error stack) | Medium     | V1 logs entity counts but not always error context. V2's structured logging layer should include: `blockHeight`, `batchId`, `entityType`, `entityId` in all error logs.                                                                                                                                                                                                               |

### 5. Data Parity for V1->V2 Migration

| Feature                       | Why Expected                                                                                                       | Complexity | Notes                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated V1 vs V2 comparison | Before production cutover, automated tooling must verify V2 produces identical data to V1 for the same block range | High       | **This is the highest-risk feature for the V2 rewrite.** Strategy detailed in "Migration Validation" section below.                                                                     |
| Side-by-side deployment       | V1 and V2 must run simultaneously against the same chain during validation                                         | Medium     | Both indexers need separate PostgreSQL databases but can share the same RPC endpoint (within rate limits). Docker Compose can run two indexer containers with different DB_URL configs. |
| Zero-downtime cutover         | V1 stays live until V2 is validated. Switch is a Hasura metadata reconfiguration, not a service restart            | Low        | Hasura can point to either database. Cutover is: (1) validate V2 data matches V1, (2) update Hasura to point at V2 DB, (3) stop V1.                                                     |

### 6. Production Deployment

| Feature                         | Why Expected                                                                              | Complexity | Notes                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Docker containerization         | Production runs in Docker. Dockerfile must build cleanly, start.sh must handle migrations | Low        | V1 already has `Dockerfile` and `docker-compose.yaml`. V2 needs same treatment, possibly shared since V2 is in the same monorepo. |
| Environment-based configuration | All tunables (RPC URL, rate limits, fetch sizes, DB connection) via environment variables | Low        | V1 already does this via `packages/indexer/src/constants/index.ts` with `dotenv`. V2 should replicate.                            |
| Graceful shutdown               | SIGTERM/SIGINT must flush in-progress batch and close DB connections cleanly              | Low        | Subsquid processor handles SIGINT. V2's metadata worker pool (if using threads) needs explicit shutdown.                          |

## Differentiators

Features that set apart a high-quality LUKSO indexer. Not expected, but valuable.

| Feature                                        | Value Proposition                                                                                                                                                   | Complexity | Notes                                                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin-based architecture (1-file-per-handler) | Adding a new LSP standard or event type requires exactly 1 file. No 4-file lockstep changes. Dramatically lowers maintenance cost                                   | High       | **This is the core value proposition of V2.** The EntityHandler + PluginRegistry + enrichment queue architecture replaces V1's massive `scanLogs` switch/case + `populateEntities` god functions. Already partially implemented. |
| Enrichment queue with deferred FK resolution   | Raw entities persist immediately, FK references resolve in a separate batch UPDATE pass. Eliminates entity removal for invalid addresses.                           | Medium     | Already implemented in V2 (#101). This is architecturally cleaner than V1's populate-then-remove pattern.                                                                                                                        |
| Metadata worker thread pool                    | Metadata fetching (IPFS/HTTP) runs in worker threads, not blocking the main event processing loop                                                                   | Medium     | V2 has `metadataWorkerPool` in its compiled artifacts. This prevents IPFS timeout cascades from stalling block processing. V1's single-process architecture is a known bottleneck.                                               |
| Concurrency-limited metadata fetching          | Use `p-limit` or `Promise.allSettled()` instead of fire-and-forget + spin-wait. Provides backpressure, prevents gateway overload, and eliminates infinite-loop risk | Low        | Direct fix for V1's spin-wait anti-pattern documented in CONCERNS.md. V2 should use `p-limit(50)` or similar.                                                                                                                    |
| LRU address verification cache                 | Cache `supportsInterface()` results to avoid redundant on-chain calls for known addresses                                                                           | Low        | Already implemented in V2 (#17). Reduces RPC load significantly for addresses seen in multiple batches.                                                                                                                          |
| Batch-level processing metrics                 | Log per-batch: block range, events processed, entities created/updated, duration, verification cache hits                                                           | Low        | Cheap to add in V2's structured logging layer. Enables capacity planning and regression detection.                                                                                                                               |
| HTTP health endpoint                           | Simple `/health` endpoint returning indexer status, current block, chain head, and processing lag                                                                   | Medium     | Enables external monitoring (Uptime Kuma, Grafana, custom alerting). Not strictly required since Docker restart handles crashes, but valuable for proactive monitoring.                                                          |
| Configurable IPFS gateway fallback             | If primary IPFS gateway fails, fall back to alternative gateways (e.g., Cloudflare IPFS, Pinata, dweb.link)                                                         | Medium     | IPFS gateway availability is a real production concern. V1 uses a single gateway. V2 could accept a comma-separated list and try in order.                                                                                       |

## Testing Patterns

### Integration Testing Approaches for Blockchain Indexers

**Confidence: MEDIUM** — Based on patterns from Subsquid v2 test files (compiled in `indexer-v2/lib/core/__tests__/`), Subsquid official docs, and general blockchain indexer best practices.

#### Strategy 1: Unit Tests with Mock Store (Recommended as Primary)

**What:** Test each EntityHandler, EventPlugin, and pipeline step in isolation using mocked Subsquid store and context.

**How:**

```typescript
// Mock store tracking inserts/upserts
const store = createMockStore(); // { insert: vi.fn(), upsert: vi.fn(), findBy: vi.fn() }
const context = createMockContext(store, [mockBlockWithLogs]);

// Test a single handler
await myEntityHandler.handle(batchContext);

// Assert entities were persisted correctly
expect(store.upsertedEntities).toContainEqual(
  expect.objectContaining({ id: '0xexpected', someField: 'value' }),
);
```

**Why recommended:**

- V2's plugin architecture makes handlers independently testable
- No database required, fast execution
- Tests the business logic (event decoding, entity construction) without infrastructure noise
- V2's existing compiled tests already follow this pattern

**What to test per handler:**

- Correct entity construction from decoded log data
- Correct `listensToBag` filtering (handler only runs for relevant events)
- Edge cases: null values, missing data, invalid addresses
- Enrichment queue interactions (FK resolution)

#### Strategy 2: Fixture-Based Pipeline Tests

**What:** Capture real blockchain data (blocks + logs) as JSON fixtures and replay through the full pipeline.

**How:**

```typescript
// fixtures/block-1234567.json — captured from actual LUKSO chain data
const fixtureBlock = loadFixture('block-1234567.json');

const store = createMockStore();
const context = createMockContext(store, [fixtureBlock]);

await processBatch(context, { registry, verifyAddresses: mockVerify, workerPool: mockPool });

// Assert all expected entities created
expect(store.insertedEntities).toHaveLength(expectedCount);
```

**Why valuable:**

- Tests full pipeline integration with real data shapes
- Catches ABI decoding issues (real log data vs. mock data)
- Captures regression baselines

**Fixture capture approach:**

1. Use a script that calls LUKSO RPC to fetch blocks containing known events
2. Serialize block + logs + transactions to JSON
3. Store in `__fixtures__/` directory alongside tests
4. Version control fixtures (they're deterministic blockchain data)

**Recommended fixtures to capture:**

- Block with LSP7 Transfer event
- Block with LSP8 Transfer event (with tokenId)
- Block with DataChanged event for each data key type (LSP3, LSP4, LSP5, LSP6, LSP8, LSP12, LSP29)
- Block with Follow/Unfollow events
- Block with DeployedContracts event
- Block with multiple event types in a single block (most realistic)

#### Strategy 3: Snapshot Testing for Entity Output

**What:** Serialize entity output to JSON snapshots and compare on subsequent runs.

**How:**

```typescript
const entities = await processFixtureBlock('block-with-lsp3-update.json');
expect(entities).toMatchSnapshot();
```

**Why valuable:**

- Catches unintentional entity shape changes
- Low maintenance once snapshots are established
- Perfect for V1 vs V2 comparison — snapshot V1 output, verify V2 matches

**Caution:** UUID-based IDs must be deterministic in tests (mock `uuidv4()`) or excluded from snapshots.

#### Strategy 4: Database Integration Tests (for Critical Paths Only)

**What:** Run against a real PostgreSQL instance (Docker) for testing persistence, upsert behavior, and query correctness.

**How:**

```typescript
// In beforeAll: start testcontainers PostgreSQL
const pg = await new PostgreSqlContainer().start();
const store = new TypeormStore(pg.connectionString);

// Run pipeline with real store
await processBatch(realContext, { registry, verifyAddresses, workerPool });

// Query DB directly to verify state
const profile = await store.findOneBy(UniversalProfile, { id: '0xaddress' });
expect(profile.lsp3Profile).not.toBeNull();
```

**Why valuable:**

- Tests TypeORM entity mappings and FK constraints
- Tests upsert vs insert behavior
- Tests query performance for findBy operations
- Most realistic but slowest

**When to use:**

- Only for critical paths: entity verification -> population -> persistence
- For V1 vs V2 data comparison validation
- Not for every handler test — too slow

### Recommended Test Framework Setup

```bash
# Install
pnpm add -D vitest @vitest/coverage-v8

# vitest.config.ts
export default {
  test: {
    root: 'packages/indexer-v2/src',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
  },
};
```

**Test file organization:**

```
packages/indexer-v2/src/
  plugins/
    lsp7Transfer/
      index.ts
      __tests__/
        lsp7Transfer.test.ts
  handlers/
    totalSupply/
      index.ts
      __tests__/
        totalSupply.test.ts
  core/
    __tests__/
      pipeline.test.ts
      batchContext.test.ts
  __fixtures__/
    blocks/
      block-with-lsp7-transfer.json
      block-with-data-changed-lsp3.json
```

### Test Priority Order

1. **Pipeline integration test** — Full 6-step pipeline with mocked dependencies (already exists in compiled form)
2. **BatchContext unit tests** — Enrichment queue, entity sealing (already exists in compiled form)
3. **EventPlugin tests** — Each of the 11 event plugins with mock log data
4. **EntityHandler tests** — Each handler with mock BatchContext
5. **Metadata fetcher tests** — LSP3/LSP4/LSP29 with mocked HTTP responses
6. **Fixture-based regression tests** — Real block data through full pipeline
7. **V1 vs V2 comparison tests** — Database snapshot comparison

## Migration Validation

### V1 -> V2 Data Comparison Strategies

**This is the highest-risk area for the V2 rewrite.** The project requirement is: "V2 must produce identical database state to V1 for the same blockchain data."

#### Strategy A: Table-Level Row Count + Checksum (Recommended First Pass)

**What:** Compare every table between V1 and V2 databases for row counts and content checksums.

**How:**

```sql
-- Run against both V1 and V2 databases
SELECT
  tablename,
  (xpath('/row/cnt/text()', xml_count))[1]::text::bigint AS row_count
FROM (
  SELECT
    table_name AS tablename,
    query_to_xml('SELECT count(*) AS cnt FROM ' || table_name, false, false, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY tablename;
```

**Compare script approach:**

1. Run V1 and V2 against same block range (e.g., blocks 0 to N)
2. Wait for both to complete
3. Query row counts for all ~80 tables
4. Flag tables with count mismatches
5. For matching counts, compute MD5 checksum of sorted rows:

```sql
SELECT md5(string_agg(t.*::text, '' ORDER BY id)) FROM my_table t;
```

**Complexity:** Medium — mostly SQL scripting
**Confidence:** HIGH that this catches gross errors (missing handlers, wrong entity types)

#### Strategy B: Entity-Level Diff for Mismatched Tables

**What:** When table checksums don't match, drill down to find exact row differences.

**How:**

```sql
-- Find rows in V1 but not in V2
SELECT * FROM v1_db.universal_profile
EXCEPT
SELECT * FROM v2_db.universal_profile;

-- Find rows in V2 but not in V1
SELECT * FROM v2_db.universal_profile
EXCEPT
SELECT * FROM v1_db.universal_profile;
```

**Approach:**

- Use `dblink` or `postgres_fdw` to query across databases
- Or export both to CSV and diff
- Focus on deterministic fields (exclude UUID-based event IDs, timestamps that depend on processing time)

**Known expected differences to account for:**

- UUID-based event entity IDs (Transfer, Executed, Follow, etc.) will differ between V1 and V2 since they're generated at runtime. **Compare by non-ID fields.**
- Entity ordering in arrays (e.g., LSP3ProfileTags) may differ. **Sort before comparing.**
- V2's enrichment queue may leave FKs null where V1 removed the entity entirely. **This is an expected architectural difference — document and validate it doesn't affect API queries.**

#### Strategy C: GraphQL API Response Comparison

**What:** Compare Hasura GraphQL query results between V1 and V2 for key queries.

**How:**

```typescript
// For each key query:
const v1Result = await fetch('http://v1-hasura/v1/graphql', {
  body: JSON.stringify({ query: QUERY }),
});
const v2Result = await fetch('http://v2-hasura/v1/graphql', {
  body: JSON.stringify({ query: QUERY }),
});
// Deep comparison ignoring known differences
assertDeepEqual(v1Result, v2Result, { ignoreFields: ['id'] });
```

**Key queries to compare:**

1. `universalProfiles(first: 100)` — profile listing
2. `digitalAssets(first: 100)` — token listing
3. `universalProfile(id: "0xKnownAddress")` — single profile with all relations
4. `transfers(first: 100, orderBy: blockNumber_DESC)` — recent transfers
5. `follows(first: 100)` — social graph
6. `ownedAssets(where: { owner: "0xKnownAddress" })` — balance queries

**Why valuable:** Tests the actual consumer experience, not just database state.

**Complexity:** Low — straightforward HTTP comparison
**Confidence:** MEDIUM — only tests query shapes that are explicitly tested, may miss edge cases

#### Strategy D: Block-Range Spot Checks

**What:** Select specific blocks known to contain edge cases and verify V2 handles them correctly.

**Edge case blocks to identify:**

- First block with each event type (genesis coverage)
- Block with maximum events (stress test)
- Block where a contract is deployed AND receives events in the same block
- Block where the same address appears in multiple events (dedup testing)
- Block where an address was previously invalid but becomes valid (verification caching)
- Block with LSP4Creators[].length DataChanged event (tests the switch fall-through bug fix)

### Side-by-Side Deployment Pattern

**Architecture:**

```
                  LUKSO RPC (shared)
                  /                \
         V1 Indexer              V2 Indexer
              |                       |
         V1 Postgres             V2 Postgres
              |                       |
         V1 Hasura               V2 Hasura
              |                       |
         (production)     (validation / comparison)
```

**Implementation with Docker Compose:**

```yaml
# docker-compose.validation.yaml
services:
  v2-indexer:
    build: ./
    environment:
      - DB_URL=postgresql://user:pass@v2-postgres:5432/v2db
      - RPC_URL=${RPC_URL}
      - RPC_RATE_LIMIT=5 # Half of total budget
    depends_on:
      v2-postgres:
        condition: service_healthy

  v2-postgres:
    image: postgres:17-alpine
    volumes:
      - v2-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=v2db

  v2-hasura:
    image: hasura/graphql-engine:v2.46.0
    # ... same config as V1 but pointing to v2-postgres
```

**Key considerations:**

- **RPC rate limit sharing:** V1 and V2 together must not exceed the RPC rate limit. Split `RPC_RATE_LIMIT` between them (e.g., 5 each for a 10/s limit). Or use separate RPC endpoints.
- **Sync from same start block:** Both must start from the same block to produce comparable data.
- **Metadata fetching timing:** IPFS content may change between V1 and V2 fetches. For validation, either disable metadata fetching or accept metadata content differences.
- **Disk space:** Two full PostgreSQL databases. For LUKSO mainnet, budget ~2x current V1 database size.

### Recommended Validation Sequence

1. **Unit tests pass** (all handlers, plugins, pipeline)
2. **Run V2 against limited block range** (e.g., first 100K blocks) with known event coverage
3. **Compare V2 output against V1 for same range** using Strategy A (row counts)
4. **Drill into mismatches** using Strategy B (entity-level diff)
5. **Run V2 against full chain** and catch up to V1
6. **Compare full database** using Strategy A + B
7. **Compare GraphQL responses** using Strategy C
8. **Run side-by-side for 24-48 hours** with both processing live blocks
9. **Compare continuously** — verify both produce same entities for same new blocks
10. **Cut over** — point Hasura to V2, stop V1

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature                                    | Why Avoid                                                                                                                                                                                                      | What to Do Instead                                                                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom GraphQL resolvers**                    | Hasura auto-generates the entire GraphQL API from the TypeORM schema. Custom resolvers add maintenance burden, bypass Hasura's caching/permissions, and create a parallel API surface to maintain              | Keep the Hasura auto-generated API. If query shapes are insufficient, add SQL views (like the existing `sql-views/`) that Hasura exposes automatically               |
| **Real-time websocket subscriptions**           | Adding custom websocket notification for new events is complex and V1 doesn't have it. Hasura already provides GraphQL subscriptions out of the box                                                            | Use Hasura's built-in subscription support. No custom implementation needed                                                                                          |
| **In-memory caching layer (Redis)**             | The indexer is a write-heavy pipeline, not a read-heavy API. Adding Redis between the indexer and PostgreSQL adds operational complexity for no throughput benefit                                             | Let PostgreSQL handle all state. Hasura provides response caching for read queries if needed                                                                         |
| **Horizontal scaling / sharding**               | LUKSO has modest block production (~2s blocks) and event volume compared to Ethereum mainnet. A single indexer process handles the load. Sharding introduces consistency nightmares                            | Keep single-process architecture. If throughput becomes an issue, optimize batch processing (parallel handlers, worker pools) before considering sharding            |
| **Custom block fetching / RPC polling**         | Building custom block fetching bypasses Subsquid's optimized gateway + archive. Hand-rolling RPC polling is slower, more error-prone, and loses reorg handling                                                 | Use Subsquid's `EvmBatchProcessor` which efficiently combines archive gateway (fast historical sync) with RPC (real-time tip-following)                              |
| **New LSP standards not in V1**                 | V2 must achieve data parity with V1 first. Adding new standards (LSP9, LSP10, LSP11, LSP15, LSP16, LSP17, LSP18, LSP20, LSP25) before validating existing ones risks scope creep and delays production cutover | Complete V2 parity, cut over to production, THEN add new standards as individual EntityHandler files. The plugin architecture makes this trivially easy post-cutover |
| **Schema changes during V2 migration**          | Changing the `schema.graphql` would break V1 which shares the same schema package. Any schema change invalidates the V1 vs V2 comparison                                                                       | Freeze schema until V2 is live. Post-cutover, schema changes are safe                                                                                                |
| **Marketplace functionality**                   | Already explicitly removed from V2 scope (issues #40-#46, #56 closed). Marketplace is a separate domain with complex state machine logic (listing lifecycle)                                                   | If marketplace indexing is needed later, add it as a set of EntityHandlers post-cutover. The architecture supports it                                                |
| **Sophisticated retry queue (Kafka, RabbitMQ)** | Message queues add operational complexity. The indexer's retry needs are simple: retry failed metadata fetches N times with error tracking per entity                                                          | Use in-process retry with `retryCount` tracking on entities (already implemented in V1). A simple `p-limit` concurrency limiter replaces the need for a queue        |
| **Multi-chain support**                         | LUKSO is a single chain. Building multi-chain abstractions is premature. Subsquid supports multi-chain if ever needed                                                                                          | Single-chain configuration. If multi-chain is needed, Subsquid's multichain support can be adopted later                                                             |

## Feature Dependencies

```
Error Recovery (Subsquid built-in)
    └── No dependency — comes free with framework

Structured Logging
    └── No dependency — can be built independently
    └── Consumed by: all handlers, pipeline, metadata fetchers

EntityHandler Migration (remaining handlers)
    ├── Permissions handler → depends on: EntityHandler interface (#105)
    ├── Follower system handler → depends on: EntityHandler interface (#105)
    ├── LSP3 metadata fetcher → depends on: EntityHandler interface, metadata worker pool
    ├── LSP4 metadata fetcher → depends on: EntityHandler interface, metadata worker pool
    └── LSP29 metadata fetcher → depends on: EntityHandler interface, metadata worker pool

Entry Point & Startup
    ├── depends on: all handlers migrated
    ├── depends on: processor configuration
    └── depends on: structured logging

Integration Testing
    ├── depends on: entry point working (pipeline runs end-to-end)
    ├── depends on: fixture capture tooling
    └── consumed by: V1 vs V2 validation

V1 vs V2 Comparison
    ├── depends on: V2 running end-to-end (entry point)
    ├── depends on: comparison SQL scripts
    └── depends on: side-by-side Docker Compose

Production Cutover
    ├── depends on: V1 vs V2 comparison passing
    ├── depends on: side-by-side deployment stable
    └── depends on: Docker deployment config
```

## MVP Recommendation

For the remaining V2 work, prioritize in this order:

### Phase 1: Complete Handler Migration

1. Refactor totalSupply, ownedAssets, decimals to EntityHandler interface (#105)
2. Delete legacy code (#106)
3. FormattedTokenId EntityHandler (#113)
4. Permissions handler (#50)
5. Follower system handler (#52)

### Phase 2: Metadata & Logging (parallelizable)

1. LSP3 metadata fetch handler (#53)
2. LSP4 metadata fetch handler (#54)
3. LSP29 metadata fetch handler (#55)
4. Structured logging layer (#94) — can run in parallel with metadata handlers

### Phase 3: Wire Up & Test

1. Processor configuration (#57)
2. Entry point & startup (#58)
3. Integration tests (#59) — unit tests for each handler + pipeline integration test

### Phase 4: Validate & Deploy

1. V1 vs V2 data comparison tooling
2. Side-by-side deployment
3. Docker deployment configuration
4. Validation period (24-48h side-by-side)
5. Production cutover

**Defer to post-cutover:**

- HTTP health endpoint
- IPFS gateway fallback
- Batch processing metrics dashboard
- New LSP standards
- Marketplace indexing

## Sources

- Subsquid SDK Overview: https://docs.subsquid.io/sdk/overview/ (HIGH confidence)
- Subsquid Batch Processing: https://docs.subsquid.io/sdk/resources/batch-processing/ (HIGH confidence)
- Subsquid RPC ingestion and reorgs: https://docs.subsquid.io/sdk/resources/unfinalized-blocks/ (HIGH confidence)
- Subsquid External APIs and IPFS: https://docs.subsquid.io/sdk/resources/external-api/ (HIGH confidence)
- LUKSO Standards Introduction: https://docs.lukso.tech/standards/introduction (HIGH confidence)
- Codebase analysis: `.planning/codebase/` files (HIGH confidence — direct code inspection)
- V2 compiled test patterns: `packages/indexer-v2/lib/core/__tests__/` (HIGH confidence — actual test code)
- Pino logger: https://github.com/pinojs/pino (HIGH confidence — for structured logging patterns)
- Blockchain indexer data validation patterns: Based on training data + general database comparison techniques (MEDIUM confidence)

---

_Researched: 2026-02-06_
