# Phase 3: Metadata Fetch Handlers - Research

**Researched:** 2026-02-09
**Domain:** Metadata fetching (IPFS/HTTP), sub-entity parsing, head-only DB backlog drain
**Confidence:** HIGH

## Summary

This phase builds three metadata "fetch" handlers — one each for LSP3, LSP4, and LSP29 — that subscribe to the main metadata entity bags created by the existing base handlers, query the DB for unfetched entities at chain head, use the MetadataWorkerPool to fetch JSON, parse JSON into sub-entities, and persist results via BatchContext.

The existing V2 infrastructure is well-suited for this work. The `MetadataWorkerPool.fetchBatch()` API handles parallelism and retries transparently. The `queueClear()` mechanism handles sub-entity deletion. The `EntityHandler` interface supports `async handle()` which allows DB queries and worker pool usage inside handlers.

**Critical finding:** The public `FetchResult` type returned by `MetadataWorkerPool.fetchBatch()` strips `errorCode` and `errorStatus` fields. Only `{ id, entityType, success, data?, error? }` is returned. Entity-level error tracking needs `fetchErrorCode` and `fetchErrorStatus` for the cross-batch retry prioritization logic. The `FetchResult` type must be extended OR the error string must be parsed to extract code/status for entity updates.

**Primary recommendation:** Extend `FetchResult` to include `errorCode?` and `errorStatus?`, and update `MetadataWorkerPool.fetchBatch()` to preserve these from worker results. This is a small, targeted change that enables faithful error tracking.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Sub-entity lifecycle

- Two distinct paths based on data value:
  - **Non-empty data value:** Decode URL → fetch at chain head → on success only, `queueClear()` old sub-entities then insert new ones. Stale sub-entities remain if fetch fails (stale data better than no data).
  - **Empty data value (`0x`):** Immediately `queueClear()` all sub-entities for that address + update main entity with `url: null`, `isDataFetched: false`. This is the explicit "metadata removed" path.
- Main metadata entity is never deleted — only updated. Null URL means nothing to fetch, backlog drain skips it.

#### Fetch scope at chain head

- Match V1 behavior: at chain head (`isHead === true`), query DB for all `isDataFetched: false` entities up to a configurable limit (`FETCH_LIMIT`), not just entities in the current batch.
- Prioritization order: (1) unfetched with no errors, (2) retryable HTTP status codes (408, 429, 5xx), (3) retryable error codes (ETIMEDOUT, EPROTO).
- This drains the backlog accumulated during historical sync. Without it, metadata from historical sync would never be fetched.

#### Error tracking on entities

- Match V1's per-entity error fields exactly: `fetchErrorMessage`, `fetchErrorCode`, `fetchErrorStatus`, `retryCount`.
- Worker pool handles retry within a single batch run (transient failures). Entity-level fields handle retry across batch runs over time. They are complementary.
- After `FETCH_RETRY_COUNT` attempts across batches, stop retrying that entity.
- On successful fetch: clear all error fields + set `isDataFetched: true`.

#### Handler granularity

- One handler per metadata standard: LSP3, LSP4, LSP29 (three separate handler files).
- Shared fetch utility function (e.g., `fetchAndPersistMetadata()` in `utils/`) handles the common flow: worker pool interaction, error tracking updates, `isHead` gating, `queueClear()` on success.
- Each handler provides its own parsing function and sub-entity type list to the shared utility.
- LSP4 has unique complexity: handles both DataChanged and TokenIdDataChanged triggers, BaseURI resolution for NFTs, Score/Rank extraction from attributes.

### Claude's Discretion

- Shared fetch utility internal structure and signature
- How to split worker pool requests across the three handlers (sequential vs. combined batch)
- Test structure and mock patterns for metadata fetch handlers
- Exact sub-entity parsing implementation (faithful port from V1 utils)

### Deferred Ideas (OUT OF SCOPE)

(None specified in CONTEXT.md)
</user_constraints>

## Standard Stack

No new libraries needed. All dependencies are already in the project.

### Core (already available)

| Library                   | Purpose                                          | Where Used                |
| ------------------------- | ------------------------------------------------ | ------------------------- |
| `@chillwhales/typeorm`    | Entity classes (LSP3Profile, LSP4Metadata, etc.) | Handler entity creation   |
| `@subsquid/typeorm-store` | `Store` for DB find/upsert/insert/remove         | Head-only backlog queries |
| `typeorm`                 | `In`, `IsNull`, `Not`, `LessThan` operators      | Query unfetched entities  |
| `uuid` (`v4`)             | UUID generation for sub-entity IDs               | Sub-entity creation       |
| `viem`                    | `bytesToBigInt`, `hexToBytes`, etc.              | LSP29 data parsing        |
| `@lukso/lsp3-contracts`   | `LSP3ProfileMetadataJSON` type                   | JSON type guard           |
| `@lukso/lsp4-contracts`   | `LSP4DigitalAssetMetadataJSON` type              | JSON type guard           |
| `vitest`                  | Testing framework                                | Handler unit tests        |

### Supporting (already available)

| Library                         | Purpose                     | When to Use                    |
| ------------------------------- | --------------------------- | ------------------------------ |
| `MetadataWorkerPool`            | Parallel IPFS/HTTP fetch    | `hctx.workerPool.fetchBatch()` |
| `BatchContext`                  | Entity bag + `queueClear()` | Sub-entity management          |
| `pino` (via `createStepLogger`) | Structured logging          | Handler observability          |

## Architecture Patterns

### Recommended File Structure

```
packages/indexer-v2/src/
├── handlers/
│   ├── lsp3ProfileFetch.handler.ts     # NEW - LSP3 metadata fetch
│   ├── lsp4MetadataFetch.handler.ts    # NEW - LSP4 metadata fetch
│   └── lsp29EncryptedAssetFetch.handler.ts  # NEW - LSP29 metadata fetch
├── utils/
│   ├── index.ts                         # Existing utils (add isVerification, isFileImage, isFileAsset)
│   └── metadataFetch.ts                 # NEW - Shared fetch + parse + error-tracking utility
└── core/
    └── types/metadata.ts                # MODIFY - Extend FetchResult with errorCode/errorStatus
```

### Pattern 1: Fetch Handler as EntityHandler

**What:** Each fetch handler implements `EntityHandler` and subscribes to the main entity bag (e.g., `'LSP3Profile'`). It runs during Step 3 (HANDLE) of the pipeline.

**When to use:** All three metadata fetch handlers follow this pattern.

**How it works in the pipeline:**

1. Base handler (e.g., `lsp3Profile.handler.ts`) runs first (no `dependsOn`), creates `LSP3Profile` entities in the batch with `isDataFetched: false`.
2. Fetch handler (e.g., `lsp3ProfileFetch.handler.ts`) subscribes to `'LSP3Profile'` bag, runs second via `dependsOn: ['lsp3Profile']`.
3. Inside `handle()`:
   - **Empty value path:** Check entities in batch for `url === null`. For these, `queueClear()` all sub-entity types and update entity.
   - **Head-only fetch path:** If `hctx.isHead`, query DB for unfetched entities, build `FetchRequest[]`, call `workerPool.fetchBatch()`, parse results, create sub-entities via `batchCtx.addEntity()`, `queueClear()` old sub-entities.

**Key insight:** The handler's `handle()` method is `async`, and the pipeline awaits it. This means DB queries and `workerPool.fetchBatch()` (which can take seconds) block the pipeline for this handler — but only for this handler. Other handlers process before/after.

```typescript
const LSP3ProfileFetchHandler: EntityHandler = {
  name: 'lsp3ProfileFetch',
  listensToBag: ['LSP3Profile'],
  dependsOn: ['lsp3Profile'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    // 1. Handle empty value path (0x → url is null)
    handleEmptyValues(hctx, triggeredBy);

    // 2. Head-only backlog drain
    if (!hctx.isHead) return;

    const unfetched = await queryUnfetchedEntities(hctx.store, LSP3Profile, FETCH_LIMIT);
    if (unfetched.length === 0) return;

    const requests = unfetched.map((entity) => ({
      id: entity.id,
      url: entity.url!,
      entityType: 'LSP3Profile',
      retries: 0,
    }));

    const results = await hctx.workerPool.fetchBatch(requests);

    for (const result of results) {
      if (result.success) {
        // Parse JSON, create sub-entities, queueClear old ones
      } else {
        // Update entity with error fields, increment retryCount
      }
    }
  },
};
```

### Pattern 2: Shared Fetch Utility

**What:** A `metadataFetch.ts` utility in `utils/` that encapsulates the common flow for all three handlers.

**Recommended signature:**

```typescript
interface MetadataFetchConfig<TEntity, TSubEntities> {
  /** Entity class for DB queries */
  entityClass: EntityConstructor<TEntity>;
  /** Entity type key in BatchContext */
  entityType: string;
  /** Extract URL from entity */
  getUrl: (entity: TEntity) => string | null;
  /** Sub-entity classes for queueClear on success */
  subEntityTypes: Array<{ class: EntityConstructor<any>; fkField: string }>;
  /** Parse fetched JSON data into sub-entities */
  parseSubEntities: (entity: TEntity, data: unknown) => TSubEntities | null;
  /** Store parsed sub-entities into BatchContext */
  addSubEntities: (batchCtx: IBatchContext, entity: TEntity, subEntities: TSubEntities) => void;
  /** Get entity-level metadata from parsed result (e.g., version, contentId for LSP29) */
  getEntityUpdates?: (subEntities: TSubEntities) => Record<string, unknown>;
}

async function fetchAndPersistMetadata<TEntity extends Entity, TSubEntities>(
  hctx: HandlerContext,
  config: MetadataFetchConfig<TEntity, TSubEntities>,
): Promise<void>;
```

### Pattern 3: Empty Value (0x) Handling

**What:** When `decodeVerifiableUri('0x')` is called, it returns `{ value: null, decodeError: null }`. The base handlers create entities with `url: null`. The fetch handlers detect this and clear sub-entities.

**Critical observation:** The base handlers already create entities with `url: null` when dataValue is `0x`. The `decodeVerifiableUri` function returns `{ value: null, decodeError: null }` for `0x`. So entities with `url === null` already exist in the batch.

**The fetch handler's responsibility:**

1. Check entities in the current batch for `url === null`
2. For each: `queueClear()` all sub-entity types for that entity's ID
3. The entity itself stays with `url: null, isDataFetched: false` — the base handler already set these fields

**Important:** This runs every batch (not just at head), because metadata removal can happen in historical blocks too.

### Pattern 4: Sub-Entity Parsing (V1 → V2 Port)

**What:** Each handler provides a parsing function that converts fetched JSON into sub-entity instances.

**V1 uses `getDataFromURL()` + direct `extractSubEntities()`:**

- V1 fetches inside `extractSubEntities()` using axios directly
- V2 separates fetching (worker pool) from parsing (handler)

**V2 approach:**

- Worker pool returns `FetchResult.data` (parsed JSON)
- Handler's parsing function receives the JSON data + the parent entity
- Returns array of sub-entity instances to insert

**Common V1 utilities to port to V2 `utils/`:**

- `isVerification(obj)` — type guard for `Verification` objects
- `isFileImage(obj)` — type guard for `ImageMetadata` objects
- `isFileAsset(obj)` — type guard for `FileAsset` objects
- `isNumeric(value)` — already exists in V2 utils

### Pattern 5: Cross-Batch Retry via Entity Error Fields

**What:** Entity-level error tracking for metadata that fails to fetch.

**Entity fields (all three models have them):**

- `fetchErrorMessage: string | null` — Error message
- `fetchErrorCode: string | null` — Network error code (ETIMEDOUT, EPROTO)
- `fetchErrorStatus: number | null` — HTTP status code (408, 429, 5xx)
- `retryCount: number | null` — Cross-batch retry counter

**On fetch failure:**

```typescript
entity.fetchErrorMessage = result.error;
entity.fetchErrorCode = result.errorCode ?? null; // NEEDS FetchResult extension
entity.fetchErrorStatus = result.errorStatus ?? null; // NEEDS FetchResult extension
entity.retryCount = (entity.retryCount ?? 0) + 1;
entity.isDataFetched = false;
```

**On fetch success:**

```typescript
entity.fetchErrorMessage = null;
entity.fetchErrorCode = null;
entity.fetchErrorStatus = null;
entity.retryCount = null;
entity.isDataFetched = true;
```

**DB query prioritization (matches V1 exactly):**

```typescript
// Priority 1: Never fetched, no errors
{ url: Not(IsNull()), isDataFetched: false, fetchErrorCode: IsNull(), fetchErrorMessage: IsNull(), fetchErrorStatus: IsNull() }

// Priority 2: Retryable HTTP errors
{ url: Not(IsNull()), isDataFetched: false, fetchErrorStatus: In([408, 429, 500, 502, 503, 504]), retryCount: LessThan(FETCH_RETRY_COUNT) }

// Priority 3: Retryable network errors
{ url: Not(IsNull()), isDataFetched: false, fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']), retryCount: LessThan(FETCH_RETRY_COUNT) }
```

### Anti-Patterns to Avoid

- **V1 busy-wait pattern:** V1 uses `while (count < expected) { await timeout(1000) }`. V2 uses `await workerPool.fetchBatch()` which returns a proper Promise.
- **Fetching in non-head batches:** Never call `workerPool.fetchBatch()` outside of `isHead === true`. During historical sync, entities accumulate with `isDataFetched: false` and only get fetched when the indexer reaches chain head.
- **Direct store operations in handlers:** Handlers add to BatchContext; the pipeline handles persistence. Exception: DB **reads** (queries for unfetched entities) are allowed in handlers.
- **Losing worker pool error details:** The current `FetchResult` loses `errorCode`/`errorStatus`. Must fix this before implementing handlers.

## Don't Hand-Roll

| Problem                | Don't Build                            | Use Instead                            | Why                                                             |
| ---------------------- | -------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| IPFS/HTTP fetching     | Custom fetch logic                     | `MetadataWorkerPool.fetchBatch()`      | Handles parallelism, retries, data URLs, IPFS gateway rewriting |
| Sub-entity deletion    | Manual `store.findBy` + `store.remove` | `batchCtx.queueClear()`                | Pipeline handles execution in Step 3.5 with proper ordering     |
| Retry within a batch   | Custom retry loop                      | Worker pool's built-in retry           | Pool already does exponential backoff for retryable errors      |
| JSON parsing from URLs | `axios.get()` in handler               | Worker pool returns `FetchResult.data` | Worker threads avoid blocking main pipeline thread              |

**Key insight:** The worker pool handles ALL transient retry logic (within a single batch). The handler only needs to track cross-batch errors on the entity for the head-only backlog drain.

## Common Pitfalls

### Pitfall 1: FetchResult Missing Error Details

**What goes wrong:** The public `FetchResult` type only has `error?: string`. The entity needs `fetchErrorCode` and `fetchErrorStatus` for cross-batch retry prioritization.
**Why it happens:** `MetadataWorkerPool.fetchBatch()` strips `errorCode` and `errorStatus` from `WorkerFetchResult` when building the public response.
**How to avoid:** Extend the `FetchResult` interface to include `errorCode?: string` and `errorStatus?: number`. Update `fetchBatch()` to preserve these fields from failed results.
**Warning signs:** All failed entities get `null` for `fetchErrorCode`/`fetchErrorStatus`, meaning priority 2 and 3 retry queries never find anything.

### Pitfall 2: Handler Execution Order

**What goes wrong:** Fetch handler runs BEFORE the base handler, so the entity bag is empty.
**Why it happens:** Both handlers listen to `'DataChanged'` (for LSP3/LSP29) or `'DataChanged'+'TokenIdDataChanged'` (for LSP4). Without `dependsOn`, execution order is undefined.
**How to avoid:** Fetch handlers use `dependsOn: ['lsp3Profile']` / `dependsOn: ['lsp4Metadata']` / `dependsOn: ['lsp29EncryptedAsset']`. The registry topologically sorts handlers.
**Warning signs:** Fetch handler never sees any entities to process.

**Alternative approach:** Fetch handlers could listen to the main entity type key (e.g., `'LSP3Profile'`) instead of `'DataChanged'`. The base handler adds entities to the `'LSP3Profile'` bag, and the fetch handler subscribes to that bag. This way, the fetch handler is only triggered when main entities actually exist. However, this requires the base handler to run first, which still needs `dependsOn`.

### Pitfall 3: Sealed Raw Entity Types

**What goes wrong:** Fetch handlers try to add sub-entities using a type key that was already used by an EventPlugin in Step 1, triggering the seal check error.
**Why it happens:** If the sub-entity type key collides with a raw event entity type key.
**How to avoid:** Use distinct type keys for sub-entities (e.g., `'LSP3ProfileName'`, `'LSP4MetadataImage'`). These are NOT raw event types, so they won't be sealed.
**Warning signs:** `Error: Handler attempted to add entity to raw type 'X' which was already persisted in Step 2`.

### Pitfall 4: LSP29 Access Control Conditions FK Chain

**What goes wrong:** LSP29AccessControlCondition has FK to LSP29EncryptedAssetEncryption, not directly to LSP29EncryptedAsset. Clearing and re-inserting requires proper FK ordering.
**Why it happens:** V1's `clearSubEntities` deletes access control conditions BEFORE deleting encryptions (FK dependency). V2's `queueClear()` needs the same ordering.
**How to avoid:** Queue access control condition clear first (FK to encryption), then encryption clear (FK to encrypted asset). Or use a single clear on the encryption entity which cascades.
**Warning signs:** FK constraint violations during clear or insert.

### Pitfall 5: LSP4 Score/Rank as Separate Entities

**What goes wrong:** Forgetting to create `LSP4MetadataScore` and `LSP4MetadataRank` entities from attributes.
**Why it happens:** V1 handles Score/Rank extraction as a post-processing step on LSP4MetadataAttribute entities. It's easy to miss.
**How to avoid:** After parsing attributes, filter for `key === 'Score'` or `key === 'Rank'` with `isNumeric(value)`, and create corresponding `LSP4MetadataScore`/`LSP4MetadataRank` entities. These are OneToOne with LSP4Metadata.
**Warning signs:** Score and Rank entities never populated in the database.

### Pitfall 6: Empty Value Path Must Run Every Batch

**What goes wrong:** The `0x` / empty value handling only runs at chain head, so metadata removal during historical sync is delayed.
**Why it happens:** Wrapping the empty value check inside the `isHead` guard.
**How to avoid:** Handle the empty value path (url === null → queueClear sub-entities) BEFORE the `isHead` check. It should run in every batch.
**Warning signs:** Sub-entities persist for addresses that have already removed their metadata in a historical block.

### Pitfall 7: Vitest Alias Resolution

**What goes wrong:** Tests fail with "Cannot find module '@/constants'" or similar.
**Why it happens:** Vitest config maps `@/` to `lib/` (compiled JS), requiring a build before tests.
**How to avoid:** Run `pnpm --filter=@chillwhales/indexer-v2 build` before running tests. The vitest.setup.ts file handles the alias mapping for runtime.
**Warning signs:** Module not found errors in test runs.

## Code Examples

### V1 Sub-Entity Extraction Pattern (LSP3 — for porting)

Source: `packages/indexer/src/utils/dataChanged/lsp3Profile.ts:55-183`

```typescript
// V1 pattern — extractSubEntities returns sub-entity instances or error
export async function extractSubEntities(lsp3Profile: LSP3Profile) {
  if (!lsp3Profile.url)
    return { fetchErrorMessage: 'Error: Missing URL', fetchErrorCode: null, fetchErrorStatus: null };

  const data = await Utils.getDataFromURL<LSP3ProfileMetadataJSON>(lsp3Profile.url);
  if (typeof data !== 'object') return { fetchErrorMessage: 'Error: Invalid data', ... };
  if ('fetchErrorMessage' in data) return data;  // Propagate fetch error
  if (!data.LSP3Profile) return { fetchErrorMessage: 'Error: Invalid LSP3Profile', ... };

  const { name, description, tags, links, avatar, profileImage, backgroundImage } = data.LSP3Profile;
  // ... create sub-entity instances with uuidv4() IDs
  return { lsp3ProfileName, lsp3ProfileDescription, lsp3ProfileTags, ... };
}
```

**V2 equivalent:** Separate fetching from parsing. Worker pool fetches; handler parses `FetchResult.data`.

### V1 DB Query Pattern (3-tier priority)

Source: `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts:48-83`

```typescript
// Priority 1: Never fetched, no errors
const p1 = await context.store.find(LSP3Profile, {
  take: FETCH_LIMIT,
  where: {
    url: Not(IsNull()),
    isDataFetched: false,
    fetchErrorCode: IsNull(),
    fetchErrorMessage: IsNull(),
    fetchErrorStatus: IsNull(),
  },
});

// Priority 2: Retryable HTTP status codes
const p2 = await context.store.find(LSP3Profile, {
  take: FETCH_LIMIT - p1.length,
  where: {
    url: Not(IsNull()),
    isDataFetched: false,
    fetchErrorStatus: In([408, 429, 500, 502, 503, 504]),
    retryCount: LessThan(FETCH_RETRY_COUNT),
  },
});

// Priority 3: Retryable network error codes
const p3 = await context.store.find(LSP3Profile, {
  take: FETCH_LIMIT - p1.length - p2.length,
  where: {
    url: Not(IsNull()),
    isDataFetched: false,
    fetchErrorCode: In(['ETIMEDOUT', 'EPROTO']),
    retryCount: LessThan(FETCH_RETRY_COUNT),
  },
});
```

### V1 LSP4 Score/Rank Extraction

Source: `packages/indexer/src/app/handlers/lsp4MetadataHandler.ts:297-320`

```typescript
// After parsing attributes:
lsp4MetadataAttributes
  .filter(({ key, value }) => key === 'Score' && Utils.isNumeric(value))
  .map(
    ({ value, lsp4Metadata }) =>
      new LSP4MetadataScore({ id: uuidv4(), lsp4Metadata, value: parseInt(value) }),
  );
// Same for 'Rank' → LSP4MetadataRank
```

### V1 LSP29 Sub-Entity Extraction Pattern

Source: `packages/indexer/src/utils/dataChanged/lsp29EncryptedAsset.ts:118-274`

The LSP29 JSON has a unique structure with nested objects:

```typescript
const { version, id: contentId, title, description, images, revision, createdAt,
        file, encryption, chunks } = data.LSP29EncryptedAsset;

// File entity (optional)
const lsp29EncryptedAssetFile = file
  ? new LSP29EncryptedAssetFile({
      id: uuidv4(), lsp29EncryptedAsset,
      type: file.type, name: file.name,
      size: file.size !== undefined ? BigInt(file.size) : null,
      lastModified: file.lastModified !== undefined ? BigInt(file.lastModified) : null,
      hash: file.hash,
    })
  : null;

// Encryption entity (optional, with nested access control conditions)
const lsp29EncryptedAssetEncryption = encryption
  ? new LSP29EncryptedAssetEncryption({ ... })
  : null;

// Access control conditions (array, FK to encryption entity)
const lsp29AccessControlConditions = encryption?.accessControlConditions
  ? encryption.accessControlConditions.map((condition, index) =>
      new LSP29AccessControlCondition({
        id: uuidv4(),
        encryption: lsp29EncryptedAssetEncryption,  // FK to encryption, not to encrypted asset
        conditionIndex: index,
        contractAddress: condition.contractAddress,
        chain: condition.chain,
        ...
      })
    )
  : [];
```

### V2 Test Pattern (from existing tests)

Source: `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts`

```typescript
function createMockBatchCtx() {
  const entityBags = new Map<string, Map<string, unknown>>();
  const clearQueue: unknown[] = [];

  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    addEntity: vi.fn((type: string, id: string, entity: unknown) => {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      entityBags.get(type).set(id, entity);
    }),
    queueClear: vi.fn((request: unknown) => clearQueue.push(request)),
    queueEnrichment: vi.fn(),
    // ... other methods
    _entityBags: entityBags,
    _clearQueue: clearQueue,
  };
}

function createMockHandlerContext(batchCtx): HandlerContext {
  return {
    store: { find: vi.fn(), findBy: vi.fn() } as unknown as HandlerContext['store'],
    context: { log: { info: vi.fn(), warn: vi.fn() } } as unknown,
    isHead: false, // Override per test
    batchCtx: batchCtx as unknown as HandlerContext['batchCtx'],
    workerPool: {
      fetchBatch: vi.fn(() => Promise.resolve([])),
      shutdown: vi.fn(),
    } as HandlerContext['workerPool'],
  };
}
```

### V2 ClearRequest Pattern (from existing handlers)

Source: `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts` pattern

```typescript
// Queue clear for sub-entities before inserting new ones
hctx.batchCtx.queueClear<LSP3ProfileName>({
  subEntityClass: LSP3ProfileName,
  fkField: 'lsp3Profile',
  parentIds: [entity.id],
});
```

## Key Findings: FetchResult Type Gap

The `FetchResult` interface in `core/types/metadata.ts:25-36` is:

```typescript
export interface FetchResult {
  id: string;
  entityType: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
```

The worker thread (`metadataWorker.ts:58-67`) returns extended fields:

```typescript
interface FetchResult {
  // ... base fields
  errorCode?: string;
  errorStatus?: number;
  retryable: boolean;
}
```

But `MetadataWorkerPool.fetchBatch()` (`metadataWorkerPool.ts:157-179`) strips these for failures:

```typescript
finalResults.push({
  id: result.id,
  entityType: result.entityType,
  success: false,
  error: result.error,
  // errorCode and errorStatus NOT passed through!
});
```

**Fix required:** Add `errorCode?: string` and `errorStatus?: number` to the public `FetchResult` type and pass them through in the failure path.

## Key Findings: Empty Value (0x) Path Analysis

The `decodeVerifiableUri('0x')` function in V2 (`utils/index.ts:21`) returns `{ value: null, decodeError: null }` for `0x` input. The base handlers then create entities with `url: null`.

**What the base handlers do today:**

- `lsp3Profile.handler.ts`: Creates `LSP3Profile` with `url: null, isDataFetched: false`
- `lsp4Metadata.handler.ts`: Creates `LSP4Metadata` with `url: null, isDataFetched: false`
- `lsp29EncryptedAsset.handler.ts`: Creates `LSP29EncryptedAsset` with `url: null, isDataFetched: false`

**What the fetch handlers need to do:**

- Detect entities in the current batch where `url === null`
- `queueClear()` all sub-entity types for those entities
- Do NOT need to update the main entity (base handler already set the right fields)
- This must run in EVERY batch, not just at head

**No base handler modification needed.** The base handlers correctly create entities with `url: null` for the `0x` case.

## Key Findings: LSP4 BaseURI Complexity

V1 (`packages/indexer/src/utils/lsp4MetadataBaseUri.ts`) creates `LSP4Metadata` entities for NFTs using BaseURI resolution:

- ID format: `"BaseURI - {address} - {tokenId}"`
- URL construction: `baseUri + formattedTokenId` (with trailing slash handling)
- These entities go through the same fetch pipeline as regular LSP4Metadata

In V2, the `lsp8MetadataBaseURI.handler.ts` exists and handles the BaseURI data key. The fetch handler needs to handle entities with IDs starting with `"BaseURI - "` — these have a `tokenId` and `nft` FK that regular LSP4Metadata entities don't.

The V1 also fixes invalid URLs (ending in 'undefined') by querying NFTs for `formattedTokenId`. This URL-fixing logic should be part of the LSP4 fetch handler or a separate cleanup step.

## Key Findings: LSP29 Access Control Conditions FK Chain

LSP29 has a unique sub-entity relationship:

```
LSP29EncryptedAsset → LSP29EncryptedAssetEncryption → LSP29AccessControlCondition
```

`LSP29AccessControlCondition.encryption` is an FK to `LSP29EncryptedAssetEncryption`, not to `LSP29EncryptedAsset`.

**Implications for queueClear():**

- Must clear `LSP29AccessControlCondition` (FK to encryption) BEFORE clearing `LSP29EncryptedAssetEncryption` (FK to encrypted asset)
- V1 handles this with a two-step query: first find encryptions, then find conditions by encryption ID, delete conditions, then delete encryptions
- V2 can use two separate `queueClear()` calls, but ordering matters

**Recommendation:** Queue the access control condition clear first with FK field `encryption` and parent IDs being the encryption entity IDs (requires querying existing encryptions first), OR simply queue one clear per sub-entity type using the `lsp29EncryptedAsset` FK where possible. For access control conditions, the FK is `encryption`, not `lsp29EncryptedAsset`, so this needs special handling.

## Key Findings: Handler Execution and Async Operations

The pipeline (`pipeline.ts:254-261`) executes handlers sequentially:

```typescript
for (const handler of step3Handlers) {
  for (const bagKey of handler.listensToBag) {
    if (batchCtx.hasEntities(bagKey)) {
      await handler.handle(handlerCtx, bagKey);
    }
  }
}
```

**Implications:**

- `await handler.handle()` — async operations (DB queries, worker pool fetch) fully complete before the next handler runs
- All three fetch handlers run sequentially, not in parallel
- Worker pool calls are per-handler, not combined across handlers
- This is acceptable because each handler may produce different entity types and the pipeline needs them before proceeding

## Key Findings: Test Infrastructure

**Vitest setup:** `packages/indexer-v2/vitest.config.ts` + `vitest.setup.ts`

- Globals enabled (`describe`, `it`, `expect` available without import)
- `@/` alias resolves to `lib/` (compiled JS)
- Must build before running tests

**Established test patterns:**

1. `createMockBatchCtx()` — mock with `_entityBags`, `_clearQueue`, `_enrichmentQueue` test accessors
2. `createMockHandlerContext()` — wraps mock batchCtx with store/context/isHead/workerPool
3. Entity factory functions — `createFollow()`, `createPermissionsEvent()`, etc.
4. Assertion on `batchCtx.addEntity.mock.calls` for entity creation verification
5. Assertion on `batchCtx.queueClear.mock.calls` for sub-entity deletion verification
6. `vi.fn(() => Promise.resolve([]))` for async mock returns

**Test coverage for fetch handlers should include:**

- Empty value path (url === null → queueClear)
- Non-head batch (skip fetch)
- Head batch with unfetched entities
- Successful fetch → sub-entity creation + queueClear old ones
- Failed fetch → error field updates
- Retry count exceeded → no retry
- Mock `workerPool.fetchBatch()` returning mixed success/failure results
- Mock `store.find()` returning unfetched entities for backlog drain

## Open Questions

1. **Worker pool batching strategy across handlers**

   - What we know: Each handler calls `workerPool.fetchBatch()` independently. Three sequential calls.
   - What's unclear: Whether combining all three handlers' requests into a single `fetchBatch()` call would be more efficient.
   - Recommendation: Keep per-handler calls. Simpler, matches V1 behavior. The worker pool already parallelizes within each call. Combined batching adds complexity for minimal gain (handlers run sequentially regardless).

2. **LSP29 Access Control Conditions clear ordering**

   - What we know: FK chain is `EncryptedAsset → Encryption → AccessControlCondition`. Clearing requires proper order.
   - What's unclear: Whether `queueClear()` requests are processed in FIFO order (they appear to be, based on `pipeline.ts:270-285` which iterates `clearQueue` in order).
   - Recommendation: Queue access control condition clear BEFORE encryption clear. Both use different FK fields. Verify FIFO ordering during implementation.

3. **Sub-entity entity type keys for BatchContext**
   - What we know: Sub-entities are added to BatchContext and persisted in Step 4 (PERSIST DERIVED) via upsert.
   - What's unclear: Whether using the entity class name as the type key (e.g., `'LSP3ProfileName'`) is the right convention, or if a prefix is needed.
   - Recommendation: Use entity class names directly. They won't collide with raw event types (which are things like `'DataChanged'`, `'Transfer'`).

## Sources

### Primary (HIGH confidence)

- V2 codebase: `core/types/metadata.ts`, `core/metadataWorkerPool.ts`, `core/metadataWorker.ts` — Exact FetchRequest/FetchResult types and worker pool behavior
- V2 codebase: `core/pipeline.ts` — Pipeline handler execution flow (sequential, awaited)
- V2 codebase: `core/batchContext.ts` — Entity bag, queueClear, queueFetch API
- V2 codebase: `handlers/lsp3Profile.handler.ts`, `handlers/lsp4Metadata.handler.ts`, `handlers/lsp29EncryptedAsset.handler.ts` — Existing base handlers
- V1 codebase: `utils/dataChanged/lsp3Profile.ts`, `lsp4Metadata.ts`, `lsp29EncryptedAsset.ts` — Sub-entity extraction logic
- V1 codebase: `app/handlers/lsp3ProfileHandler.ts`, `lsp4MetadataHandler.ts`, `lsp29EncryptedAssetHandler.ts` — V1 fetch + DB query patterns
- TypeORM entity models: `packages/typeorm/src/model/generated/` — Entity field definitions

### Secondary (MEDIUM confidence)

- V2 test files: `handlers/__tests__/follower.handler.test.ts`, `lsp6Controllers.handler.test.ts` — Established test patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — All libraries already in project, no new dependencies
- Architecture: HIGH — Patterns directly derived from existing V2 codebase and V1 reference
- Pitfalls: HIGH — Discovered through direct code analysis (FetchResult gap, FK chain, seal check)
- Sub-entity parsing: HIGH — V1 source code provides exact extraction logic to port

**Research date:** 2026-02-09
**Valid until:** 2026-03-11 (stable domain, internal codebase)
