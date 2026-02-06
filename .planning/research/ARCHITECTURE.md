# Architecture Research

**Project:** LSP Indexer V2 — Completing the Rewrite
**Domain:** Blockchain event indexer pipeline architecture
**Researched:** 2026-02-06
**Confidence:** HIGH (primary source: existing codebase analysis of V1 + compiled V2 artifacts)

---

## Pipeline Integration

### The 6-Step Pipeline Is Already Implemented

The `processBatch()` function in `packages/indexer-v2/lib/core/pipeline.js` fully implements the 6-step pipeline. The remaining work is **wiring**, not **designing**. Here's what exists vs. what's missing:

**Exists (compiled JS, source lost):**

- `processBatch()` — complete orchestrator for all 6 steps
- `BatchContext` — entity bag with sealed types, enrichment queue, clear queue, persist hints
- `PluginRegistry` — auto-discovers `*.plugin.js` and `*.handler.js` files from directories
- 11 EventPlugins (all event types)
- 15 DataKey EntityHandlers (LSP3-LSP12, LSP29 data keys)
- `NFTHandler` with cross-source deduplication
- `DecimalsHandler` (old interface, needs refactoring)
- `MetadataWorkerPool` — worker thread pool for parallel IPFS/HTTP fetching
- `handlerHelpers` — `mergeEntitiesFromBatchAndDb()`, `updateTotalSupply()`, `updateOwnedAssets()`
- Pipeline tests (compiled Vitest)

**Missing (must be built as new TypeScript source):**

1. **Refactored handlers** — `totalSupply`, `ownedAssets`, `decimals` to new EntityHandler interface (#105)
2. **FormattedTokenId handler** (#113)
3. **Permissions update handler** (#50) — V2 version (the V2 compiled `lsp6Controllers.handler.js` already handles this internally using `queueClear()`)
4. **Follower system handler** (#52)
5. **LSP3 metadata fetch handler** (#53)
6. **LSP4 metadata fetch handler** (#54)
7. **LSP29 metadata fetch handler** (#55)
8. **Structured logging** (#94)
9. **Processor configuration** (#57)
10. **Entry point & startup wiring** (#58)
11. **Integration testing** (#59)
12. **Legacy code deletion** (#106)

### Pipeline Flow (Canonical Reference)

```
EXTRACT → PERSIST RAW → HANDLE → CLEAR SUB-ENTITIES → PERSIST DERIVED → VERIFY → ENRICH
  Step 1      Step 2      Step 3       Step 3.5            Step 4         Step 5   Step 6
```

**Step 1 (EXTRACT):** EventPlugins decode logs → `batchCtx.addEntity()` + `batchCtx.queueEnrichment()`
**Step 2 (PERSIST RAW):** Pipeline calls `store.insert()` for each entity type key in BatchContext
**Step 2.5:** `batchCtx.sealRawEntityTypes()` — prevents handlers from writing to raw types
**Step 3 (HANDLE):** EntityHandlers run via `registry.getAllEntityHandlers()`, triggered by `listensToBag` match
**Step 3.5 (CLEAR):** Process `batchCtx.getClearQueue()` — delete-then-reinsert for sub-entities (LSP6 permissions, etc.)
**Step 4 (PERSIST DERIVED):** Pipeline calls `store.upsert()` for derived types (skipping sealed raw types). Uses merge-upsert when `persistHint` is set.
**Step 5 (VERIFY):** Collect addresses from enrichment queue, batch `supportsInterface()`, persist core entities (UP, DA)
**Step 6 (ENRICH):** Batch `store.upsert()` to set FK fields on already-persisted entities

### Integration Pattern for Remaining Handlers

All remaining handlers must follow the established pattern visible in the compiled V2 code:

```typescript
// Handler file: handlers/{name}.handler.ts
import { EntityHandler, HandlerContext, EntityCategory } from '@/core/types';

const MyHandler: EntityHandler = {
  name: 'myHandler',
  listensToBag: ['DataChanged'], // or ['LSP7Transfer', 'LSP8Transfer'], etc.

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const events = hctx.batchCtx.getEntities<MyEventType>(triggeredBy);

    for (const event of events.values()) {
      // 1. Filter: self-select relevant events
      if (event.dataKey !== MY_DATA_KEY) continue;

      // 2. Create derived entity with null FKs
      const entity = new MyEntity({
        id: event.address,
        // ... fields
        digitalAsset: null, // FK initially null
      });

      // 3. Add to BatchContext
      hctx.batchCtx.addEntity('MyEntity', entity.id, entity);

      // 4. Queue FK enrichment
      hctx.batchCtx.queueEnrichment<MyEntity>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: 'MyEntity',
        entityId: entity.id,
        fkField: 'digitalAsset',
      });
    }
  },
};

export default MyHandler;
```

---

## Handler Dispatch

### Registration: Auto-Discovery via PluginRegistry

The `PluginRegistry` provides two discovery methods:

1. **`discover(pluginDirs: string[])`** — scans for `*.plugin.js` files, validates `EventPlugin` interface, indexes by `topic0` for O(1) routing
2. **`discoverHandlers(handlerDirs: string[])`** — scans for `*.handler.js` files, validates `EntityHandler` interface, stores in ordered list

Both use runtime `require()` to load compiled JS, check exports for `default` or named `plugin`/`handler`, and validate with type guards (`isEventPlugin`, `isEntityHandler`).

**Key constraint:** Duplicate `topic0` (plugins) or duplicate `name` (handlers) throw errors at startup — fail-fast validation.

### Dispatch: Bag-Based Triggering

Handlers are NOT ordered by explicit priority. Instead:

1. The pipeline iterates `registry.getAllEntityHandlers()` in **discovery order** (filesystem order of `*.handler.js` files)
2. For each handler, iterates its `listensToBag` array
3. If `batchCtx.hasEntities(bagKey)` is true, calls `handler.handle(handlerCtx, bagKey)`
4. A handler with `listensToBag: ['LSP8Transfer', 'TokenIdDataChanged']` gets called **twice** if both bag keys have entities

### Handler Ordering: Dependencies and Constraints

The existing V2 compiled code reveals important ordering requirements:

| Handler                     | Depends On                                   | Reason                                                         |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `nft`                       | `LSP8Transfer`, `TokenIdDataChanged` plugins | Reads raw events to create NFT entities                        |
| `formattedTokenId` (TODO)   | `nft` handler                                | Needs NFT entities in BatchContext                             |
| `lsp6Controllers`           | DataChanged plugin                           | Creates permissions sub-entities that need clear-then-reinsert |
| `totalSupply` (TODO)        | `LSP7Transfer`, `LSP8Transfer` plugins       | Reads Transfer entities for mint/burn                          |
| `ownedAssets` (TODO)        | `LSP7Transfer`, `LSP8Transfer` plugins       | Reads Transfer entities for balance tracking                   |
| `lsp3MetadataFetch` (TODO)  | `lsp3Profile` handler                        | Needs LSP3Profile entities with URLs                           |
| `lsp4MetadataFetch` (TODO)  | `lsp4Metadata` handler                       | Needs LSP4Metadata entities with URLs                          |
| `lsp29MetadataFetch` (TODO) | `lsp29EncryptedAsset` handler                | Needs LSP29 entities with URLs                                 |
| `followerSystem` (TODO)     | Follow/Unfollow plugins                      | Creates/removes Follow entities                                |

**Ordering enforcement:** Since handlers are discovered in filesystem order, naming conventions or explicit registration order controls execution sequence. The pipeline runs handlers sequentially with `await`, so order is deterministic.

**Recommendation:** Use explicit registration order in the entry point rather than relying on filesystem order. This makes dependencies visible:

```typescript
// entry point bootstrap
registry.registerEntityHandler(nftHandler);
registry.registerEntityHandler(formattedTokenIdHandler);
registry.registerEntityHandler(totalSupplyHandler);
registry.registerEntityHandler(ownedAssetsHandler);
// ... data key handlers (order-independent among themselves)
registry.registerEntityHandler(lsp3ProfileHandler);
registry.registerEntityHandler(lsp4MetadataHandler);
// ... metadata fetch handlers (must run after their data key handlers)
registry.registerEntityHandler(lsp3MetadataFetchHandler);
registry.registerEntityHandler(lsp4MetadataFetchHandler);
registry.registerEntityHandler(lsp29MetadataFetchHandler);
```

Alternatively, use `discoverHandlers()` for the bulk and only use explicit `registerEntityHandler()` for ordering-sensitive handlers.

### Handler Categories

Based on codebase analysis, handlers fall into three categories:

**1. Data Key Handlers (pure entity creation)**

- Listen to `DataChanged` or `TokenIdDataChanged`
- Filter by `dataKey` prefix/match
- Create derived entities, queue enrichment
- Examples: `lsp4TokenName`, `lsp3Profile`, `lsp6Controllers`, `lsp5ReceivedAssets`
- These are order-independent among themselves

**2. Event-Derived Handlers (aggregate computation)**

- Listen to Transfer or other event bags
- Compute aggregates or maintain denormalized tables
- Examples: `totalSupply`, `ownedAssets`, `nft`, `followerSystem`
- May depend on each other (formattedTokenId depends on nft)

**3. Metadata Fetch Handlers (async I/O, head-only)**

- Listen to data key entity bags (`LSP3Profile`, `LSP4Metadata`, `LSP29EncryptedAsset`)
- Only run when `isHead === true`
- Use `workerPool.fetchBatch()` for parallel IPFS/HTTP fetching
- Create sub-entities from parsed JSON
- Queue clear requests for delete-then-reinsert of sub-entities

---

## Merge-Upsert Patterns

### The Problem

Multiple data key events can populate different fields of the same entity. For example, `LSP5ReceivedAssets[]` Index events provide `arrayIndex` while `LSP5ReceivedAssetsMap` events provide `interfaceId`. If they fire in different batches, a plain upsert from the second batch would overwrite the first batch's non-null fields with null.

### In-Batch Merge (Handler Logic)

Handlers use `mergeEntitiesFromBatchAndDb()` to check both BatchContext and database:

```typescript
const existingAssets = await mergeEntitiesFromBatchAndDb<LSP5ReceivedAsset>(
  hctx.store,
  hctx.batchCtx,
  RECEIVED_ASSET_TYPE,
  LSP5ReceivedAsset,
  potentialIds,
);

// Then check existingAssets before creating new entities
const existing = existingAssets.get(id);
if (existing) {
  existing.arrayIndex = existing.arrayIndex ?? arrayIndex; // merge, don't overwrite
  existing.timestamp = timestamp;
  return;
}
// ... create new entity only if not found
```

### Cross-Batch Merge (Persist Hints)

Handlers set persist hints to tell the pipeline to use merge-upsert behavior:

```typescript
hctx.batchCtx.setPersistHint<LSP6Controller>(CONTROLLER_TYPE, {
  entityClass: LSP6Controller,
  mergeFields: [
    'arrayIndex',
    'permissionsRawValue',
    'allowedCallsRawValue',
    'allowedDataKeysRawValue',
  ],
});
```

The pipeline's `mergeUpsertEntities()` then:

1. Reads existing DB records by ID
2. For each `mergeField`: if new entity has null but existing has non-null, preserves existing value
3. Upserts the merged result

**Important:** Once a field is set to non-null, it cannot be cleared back to null. This is intentional for data stability.

### Sub-Entity Clear-Then-Reinsert (Clear Queue)

For entities with child records (LSP6 permissions, LSP6 allowed calls), the pattern is:

```typescript
// In handler
hctx.batchCtx.queueClear<LSP6Permission>({
  subEntityClass: LSP6Permission,
  fkField: 'controller',
  parentIds: controllerIds,
});
```

The pipeline processes this in Step 3.5, using TypeORM's `store.find()` + `store.remove()`.

---

## Logging Architecture

### Current State

V1 uses `context.log.info(JSON.stringify({ message: "...", count: N }))` — manual JSON serialization throughout. No log levels beyond info/warn/error, no correlation IDs, no structured fields.

### Recommended Logging Points in the 6-Step Pipeline

| Pipeline Step           | What to Log                                                   | Level |
| ----------------------- | ------------------------------------------------------------- | ----- |
| Step 1: EXTRACT         | Plugin name, entity count per type                            | DEBUG |
| Step 2: PERSIST RAW     | Entity type, count                                            | INFO  |
| Step 2.5: SEAL          | Sealed type count                                             | DEBUG |
| Step 3: HANDLE          | Handler name, triggered by, entities processed, derived count | INFO  |
| Step 3.5: CLEAR         | Sub-entity class, parent count, removed count                 | INFO  |
| Step 4: PERSIST DERIVED | Entity type, count, merge-upsert vs simple                    | INFO  |
| Step 5: VERIFY          | Category, new/valid/invalid counts                            | INFO  |
| Step 6: ENRICH          | Entity type, enriched count                                   | INFO  |
| Metadata fetch          | Fetch count, success/fail, retry count                        | INFO  |
| Batch summary           | Total batch time, block range, entity counts                  | INFO  |

### Structured Logging Implementation

**Recommendation:** Wrap `context.log` with a structured logger that adds:

```typescript
interface PipelineLogger {
  // Auto-adds batch context (block range, batch ID)
  step(step: string, data: Record<string, unknown>): void;
  // Auto-adds handler name
  handler(handler: string, data: Record<string, unknown>): void;
  // Performance timing
  timed<T>(label: string, fn: () => Promise<T>): Promise<T>;
}
```

**Where to integrate:**

1. **Pipeline level** — Create logger in `processBatch()`, pass to handlers via `HandlerContext`
2. **Handler level** — Each handler uses `hctx.logger` for handler-scoped logging
3. **Batch summary** — Log at end of `processBatch()` with aggregate metrics

**Key principle:** Don't change the logging interface dramatically. The V2 pipeline already logs entity counts at each step. The structured logging layer should be a thin wrapper that:

- Replaces `JSON.stringify()` calls with structured field passing
- Adds batch context (block range, timestamp) automatically
- Adds timing for performance monitoring
- Supports log level filtering

### Implementation Approach

Since `context.log` is provided by Subsquid and must be used (it integrates with their framework), the structured logger should wrap it:

```typescript
class PipelineLogger {
  constructor(
    private ctx: Context,
    private batchRange: { from: number; to: number },
  ) {}

  info(fields: Record<string, unknown>) {
    this.ctx.log.info(
      JSON.stringify({
        ...fields,
        blockRange: this.batchRange,
        ts: Date.now(),
      }),
    );
  }
}
```

This is additive — no breaking changes to existing patterns.

---

## Testing Architecture

### Existing Test Patterns (from compiled V2 tests)

The compiled `pipeline.test.js` (754 lines) and `batchContext.test.js` (199 lines) establish a clear testing architecture:

**Test Organization:**

```
packages/indexer/src/core/__tests__/
├── pipeline.test.ts          # Integration: 6-step pipeline
├── batchContext.test.ts       # Unit: BatchContext class
├── registry.test.ts           # Unit: PluginRegistry
└── handlerHelpers.test.ts     # Unit: merge utilities

packages/indexer/src/handlers/__tests__/
├── totalSupply.handler.test.ts
├── ownedAssets.handler.test.ts
├── followerSystem.handler.test.ts
├── lsp3MetadataFetch.handler.test.ts
└── ...
```

**Mock Factories (directly from compiled tests):**

```typescript
// Store mock with tracking arrays
function createMockStore() {
  const insertedEntities: any[] = [];
  const upsertedEntities: any[] = [];
  return Object.assign(
    {
      insert: vi.fn((entities) => {
        insertedEntities.push(...entities);
        return Promise.resolve();
      }),
      upsert: vi.fn((entities) => {
        upsertedEntities.push(...entities);
        return Promise.resolve();
      }),
      findBy: vi.fn(() => Promise.resolve([])),
      find: vi.fn(() => Promise.resolve([])),
      remove: vi.fn(() => Promise.resolve()),
    },
    { insertedEntities, upsertedEntities },
  );
}

// Context mock
function createMockContext(store, blocks = [mockBlock]) {
  return {
    blocks,
    store,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    isHead: false,
  };
}

// Verification mock
function createMockVerifyFn(validAddresses = new Set(), newAddresses = new Set()) {
  return vi.fn((category, addresses) => {
    const valid = new Set([...addresses].filter((a) => validAddresses.has(a)));
    const newSet = new Set([...addresses].filter((a) => newAddresses.has(a)));
    const invalid = new Set([...addresses].filter((a) => !validAddresses.has(a)));
    const newEntities = new Map();
    // create entity stubs for new addresses
    return Promise.resolve({ new: newSet, valid, invalid, newEntities });
  });
}
```

### Testing Strategies by Handler Type

**1. Data Key Handlers (unit tests):**

- Create mock `HandlerContext` with pre-populated BatchContext
- Add DataChanged events with specific `dataKey` and `dataValue`
- Assert entities were added to BatchContext with correct values
- Assert enrichment requests queued with correct FK fields

```typescript
it('should create LSP4TokenName entity from DataChanged event', () => {
  const batchCtx = new BatchContext();
  batchCtx.addEntity('DataChanged', 'dc1', {
    id: 'dc1',
    address: '0xDA',
    dataKey: LSP4DataKeys.LSP4TokenName,
    dataValue: '0x4d79546f6b656e', // "MyToken"
    timestamp: 1000,
  });

  const hctx = {
    batchCtx,
    store: createMockStore(),
    context: createMockContext(store),
    isHead: false,
    workerPool: mockPool,
  };
  handler.handle(hctx, 'DataChanged');

  const entities = batchCtx.getEntities<LSP4TokenName>('LSP4TokenName');
  expect(entities.get('0xDA')?.value).toBe('MyToken');
});
```

**2. Event-Derived Handlers (integration tests):**

- Need mock store that returns existing entities from `findBy()`
- Test cross-batch merge behavior
- Test aggregate computation (totalSupply increment/decrement)

**3. Metadata Fetch Handlers (integration tests):**

- Mock `workerPool.fetchBatch()` to return test JSON
- Test sub-entity creation from parsed metadata
- Test retry behavior with failed fetches
- Test `isHead` gating (should be no-op when `isHead === false`)

**4. Full Pipeline Tests (end-to-end):**

- Use `processBatch()` with mock store, mock verify function, and mock worker pool
- Assert correct entity persistence across all 6 steps
- Test enrichment: entities persist with null FKs, then get enriched
- Test sealed types: handlers can't write to raw entity types

### Fixture-Based Testing

For the remaining handlers, use a fixture approach:

```typescript
// fixtures/dataChanged.fixtures.ts
export const lsp4TokenNameEvent = {
  id: 'dc-1',
  address: '0x1234...abcd',
  dataKey: '0xdeba1e292f8ba11d...',
  dataValue: '0x4d79546f6b656e',
  timestamp: 1700000000,
};

export const lsp3ProfileEvent = {
  id: 'dc-2',
  address: '0x5678...efgh',
  dataKey: '0x5ef...',
  dataValue: '0x...', // encoded VerifiableURI
  timestamp: 1700000000,
};
```

### V1 vs V2 Data Comparison Testing

For production cutover validation, the project needs:

1. **Snapshot testing:** Index a known block range with V1 and V2, compare database states
2. **Entity-by-entity comparison:** Query each table, diff records by ID
3. **Automated via SQL:** Use `pg_dump` or direct SQL queries to compare table contents

This is explicitly out of scope for unit/integration testing and should be a separate DevOps concern.

---

## Entry Point Bootstrapping

### Recommended Bootstrap Sequence

Based on the existing V1 entry point (`packages/indexer/src/app/index.ts`) and V2 architecture:

```typescript
// packages/indexer/src/app/index.ts (V2 entry point)

import { PluginRegistry, MetadataWorkerPool, processBatch, verifyAddresses } from '@/core';
import { EvmBatchProcessor } from '@subsquid/evm-processor';
import { TypeormDatabase } from '@subsquid/typeorm-store';

// 1. Create registry
const registry = new PluginRegistry();

// 2. Discover plugins (auto-scan directories)
registry.discover([path.resolve(__dirname, '../plugins/events')]);

// 3. Discover handlers (auto-scan directories)
registry.discoverHandlers([
  path.resolve(__dirname, '../handlers'),
  path.resolve(__dirname, '../handlers/chillwhales'),
]);

// 4. Configure processor from registry
const processor = new EvmBatchProcessor()
  .setGateway(SQD_GATEWAY)
  .setRpcEndpoint({ url: RPC_URL, rateLimit: RPC_RATE_LIMIT })
  .setFinalityConfirmation(FINALITY_CONFIRMATION)
  .setBlockRange({ from: START_BLOCK });

// 5. Add log subscriptions from registry
for (const sub of registry.getLogSubscriptions()) {
  processor.addLog(sub);
}

// 6. Add field selections
processor.setFields({
  log: { topics: true, data: true, transactionHash: true },
  block: { timestamp: true },
});

// 7. Create worker pool
const workerPool = new MetadataWorkerPool({
  poolSize: WORKER_POOL_SIZE,
  ipfsGateway: IPFS_GATEWAY,
  maxRetries: FETCH_RETRY_COUNT,
});

// 8. Run processor
processor.run(new TypeormDatabase(), async (context) => {
  await processBatch(context, {
    registry,
    verifyAddresses,
    workerPool,
  });
});

// 9. Graceful shutdown
process.on('SIGTERM', async () => {
  await workerPool.shutdown();
  process.exit(0);
});
```

### Key Bootstrap Decisions

**Plugin discovery vs explicit registration:**

- Use `discover()` and `discoverHandlers()` for most plugins/handlers — this is the "add one file" promise
- Use explicit `registerEntityHandler()` only for handlers with strict ordering requirements
- Since `discoverHandlers()` scans recursively and sorts by filesystem order, naming prefixes (e.g., `01-nft.handler.ts`, `02-formattedTokenId.handler.ts`) could enforce order. However, explicit registration is more readable and maintainable.

**Processor configuration from registry:**

- `registry.getLogSubscriptions()` aggregates all topic0s and contract filters from plugins
- This eliminates the V1 pattern of manually listing every event topic in `processor.ts`
- New events are automatically subscribed when a plugin is added

---

## Build Order

### Recommended Implementation Order for Remaining Components

Based on dependency analysis and risk assessment:

#### Phase A: Refactor Existing (Low Risk)

1. **#105: Refactor totalSupply, ownedAssets, decimals to EntityHandler interface**

   - `totalSupply` → listens to `['LSP7Transfer', 'LSP8Transfer']`, uses `mergeEntitiesFromBatchAndDb`
   - `ownedAssets` → listens to `['LSP7Transfer', 'LSP8Transfer']`, manages OwnedAsset/OwnedToken
   - `decimals` → listens to BatchContext for newly verified DigitalAssets (special case: needs verification results, so must run at or after Step 5 — OR use a `post-verify` hook)
   - **Note on decimals:** The current DecimalsHandler uses the OLD interface (`listensTo: [EntityCategory.DigitalAsset]`). In the new interface, it should listen to a special bag key populated after verification, or the pipeline should call it directly in Step 5.

2. **#113: FormattedTokenId handler**

   - Listens to `['NFT']` (the entity type key, not an event)
   - Reads NFT entities from BatchContext, formats tokenId based on LSP8TokenIdFormat
   - Must run AFTER the `nft` handler

3. **#106: Delete legacy code**
   - Remove DataKeyPlugin interface, populate helpers, old handler helpers
   - This is safe after #105 completes

#### Phase B: New Handlers (Medium Risk)

4. **#52: Follower system handler**

   - Listens to `['Follow', 'Unfollow']`
   - Creates deterministic Follow entities, removes on Unfollow
   - Port from V1 `followerSystemHandler.ts` — straightforward

5. **#50: Permissions update handler**
   - The compiled V2 `lsp6Controllers.handler.js` already handles this internally
   - This issue may be **already resolved** by the existing handler that uses `queueClear()`
   - Verify: check if the compiled handler covers the full V1 `permissionsUpdateHandler.ts` behavior
   - If yes, this issue can be closed. If not, extend the existing handler.

#### Phase C: Metadata Fetch Handlers (Higher Risk — External I/O)

6. **#53: LSP3 metadata fetch handler**

   - Listens to `['LSP3Profile']` entity type
   - Only runs when `isHead === true`
   - Uses `workerPool.fetchBatch()` to fetch URLs
   - Creates sub-entities: LSP3ProfileName, LSP3ProfileDescription, LSP3ProfileImage, etc.
   - Queues clear requests for sub-entity deletion before re-creation

7. **#54: LSP4 metadata fetch handler**

   - Same pattern as LSP3 but for LSP4Metadata
   - Creates: LSP4MetadataAttribute, LSP4MetadataImage, LSP4MetadataAsset, etc.

8. **#55: LSP29 metadata fetch handler**
   - Same pattern for encrypted asset metadata

#### Phase D: Cross-Cutting & Wiring (Must Come After Handlers)

9. **#94: Structured logging layer**

   - Can proceed in parallel with handler work
   - Wrap `context.log` with structured fields, batch context, timing
   - Apply to pipeline and all handlers

10. **#57: Processor configuration**

    - Generate processor config from registry
    - Use `registry.getLogSubscriptions()` pattern
    - Add field selections

11. **#58: Entry point & startup wiring**

    - Bootstrap sequence: registry → discover → processor → run
    - Must come after all handlers are implemented
    - Includes graceful shutdown for worker pool

12. **#59: End-to-end integration testing**
    - Full pipeline tests with all real handlers
    - Fixture-based block/log data
    - V1 vs V2 data comparison tooling

### Dependency Graph

```
                    ┌─────────────┐
                    │  EventPlugins│ (existing, compiled)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  #105 Refactor│──→ totalSupply, ownedAssets, decimals
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │#113 Token│ │#52 Follow│ │#50 Perms │
        │  Format  │ │  System  │ │ (verify) │
        └──────────┘ └──────────┘ └──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │#53 LSP3  │ │#54 LSP4  │ │#55 LSP29 │
        │ MetaFetch│ │ MetaFetch│ │ MetaFetch│
        └──────────┘ └──────────┘ └──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │#94 Logger│ │#57 Config│ │#106 Clean│
        └──────────┘ └──────────┘ └──────────┘
                           │
                    ┌──────▼──────┐
                    │ #58 Entry   │
                    │   Point     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ #59 E2E     │
                    │   Tests     │
                    └─────────────┘
```

### Parallelizable Work

- **#94 (logging)** can proceed alongside all handler work
- **#52 (follower)**, **#50 (permissions)**, **#113 (tokenId format)** are independent of each other
- **#53, #54, #55** (metadata fetchers) share patterns and can be implemented together or sequentially
- **#106 (cleanup)** can happen anytime after #105

### Risk Assessment

| Component                  | Risk   | Reason                                              |
| -------------------------- | ------ | --------------------------------------------------- |
| #105 Refactor handlers     | LOW    | Patterns clear from compiled V2 code                |
| #113 FormattedTokenId      | LOW    | Small handler, clear interface                      |
| #52 Follower system        | LOW    | Straightforward port from V1                        |
| #50 Permissions            | LOW    | May already be handled by compiled V2 code          |
| #53/#54/#55 Metadata fetch | MEDIUM | External I/O, retry logic, sub-entity parsing       |
| #94 Structured logging     | LOW    | Thin wrapper, additive change                       |
| #57 Processor config       | LOW    | Pattern exists in registry.getLogSubscriptions()    |
| #58 Entry point            | MEDIUM | Integration of all components, startup ordering     |
| #59 E2E testing            | MEDIUM | Need to reconstruct test fixtures, verify V1 parity |

### Critical Decision: Source Recovery vs. Rewrite

The V2 compiled JS files contain complete, working implementations. The source TypeScript is lost. Two approaches:

**Option A: Reconstruct TypeScript from compiled JS**

- Pros: Preserves battle-tested logic, faster
- Cons: May miss type annotations, comments slightly different
- Effort: ~2 hours per handler to reconstruct with proper types

**Option B: Rewrite from V1 + V2 patterns**

- Pros: Clean TypeScript from scratch, proper types
- Cons: Risk of introducing bugs not in the compiled code
- Effort: ~3-4 hours per handler

**Recommendation:** Option A for core infrastructure (pipeline, batchContext, registry) and complex handlers (lsp6Controllers, lsp5ReceivedAssets, nft). Option B for simple handlers where the V2 compiled code closely mirrors V1 logic.

---

## Anti-Patterns to Avoid

### 1. Direct Store Access in Handlers

**Don't:** Have handlers call `store.insert()` or `store.upsert()` directly.
**Do:** Add entities to BatchContext via `addEntity()` and let the pipeline handle persistence.

**Exception:** The `decimals` handler and `ownedAssets` handler legitimately need direct store access because they compute aggregates that require reading existing DB state. Use `mergeEntitiesFromBatchAndDb()` for this.

### 2. Adding to Sealed Entity Types

**Don't:** Have handlers add entities to the same type key used by EventPlugins (e.g., adding to 'Transfer' in a handler).
**Do:** Use distinct type keys for derived entities (e.g., 'TotalSupply', 'OwnedAsset').

The pipeline enforces this via `sealRawEntityTypes()` — it will throw if violated.

### 3. Relying Only on BatchContext for Existing Entities

**Don't:** Check only `batchCtx.getEntities()` when looking for existing entities.
**Do:** Always use `mergeEntitiesFromBatchAndDb()` to check both batch and database.

This is the #1 correctness pattern in the V2 codebase. Missing it causes data loss across batch boundaries.

### 4. Spin-Wait Polling for Async Work

**Don't:** Use `while (!done) { await timeout(1000); }` for waiting on async operations.
**Do:** Use `workerPool.fetchBatch()` which returns a Promise with all results via `Promise.all()`.

The V2 MetadataWorkerPool already solves this. Don't replicate the V1 spin-wait pattern.

### 5. Forgetting to Initialize FK Fields as null

**Don't:** Omit FK fields from entity constructors.
**Do:** Always explicitly set FK fields to `null` in the constructor.

The enrichment step uses `in` operator to check if the FK field exists on the entity instance. TypeORM uses `Object.assign(this, props)`, so fields only exist if explicitly passed. Omitting `digitalAsset` from the constructor means `'digitalAsset' in entity` returns `false`, and the pipeline logs a warning and skips enrichment.

---

_Researched: 2026-02-06_
_Sources: Codebase analysis of V1 source (packages/indexer/src/) and V2 compiled artifacts (packages/indexer-v2/lib/). All findings are HIGH confidence — derived from direct code analysis, not external sources._
