# Phase 1: Handler Migration - Research

**Researched:** 2026-02-06
**Domain:** V2 EntityHandler migration — totalSupply, ownedAssets, decimals, formattedTokenId
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### FormattedTokenId behavior

- Preserve V1's retroactive update behavior: when LSP8TokenIdFormat changes for a contract, query DB and reformat ALL existing NFTs for that contract
- When LSP8TokenIdFormat is unknown or not yet set, leave `formattedTokenId` as null — only populate once the format is known
- Handler ordering must be explicit: FormattedTokenId declares a dependency on lsp8TokenIdFormat handler — registry enforces execution order
- Support same 4 formats as V1 (NUMBER, STRING, ADDRESS, BYTES32) with identical conversion logic, but log a warning when an unknown format is encountered for future investigation

#### Delete vs null-FK semantics

- Delete OwnedAsset records when balance reaches zero — match V1 behavior
- Delete OwnedToken records when token is transferred away (sender side) — match V1 behavior
- Consistent deletion approach for both entity types (no zero-balance records kept)
- When enrichment queue targets an entity that was deleted, log at debug level — expected scenario, not an error

#### V1 parity strictness

- Clamp totalSupply to zero on underflow (burn > recorded supply), but log a warning — underflow may indicate a data issue
- Clean up ID formats: do NOT match V1's `"{owner} - {address}"` format — use a cleaner format (e.g., `"{owner}:{address}"`)
- Phase 5 validation: row-count parity + automated spot checks on key records — accept known divergences (ID formats, architectural differences)
- Note ID format differences in Phase 5 comparison exclusion list

#### Handler async & DB access

- Change `EntityHandler.handle()` signature to return `Promise<void>` — all handlers become async-capable
- Add a post-verification handler hook to the pipeline (Step 5.5) for decimals handler — it needs to trigger after Digital Asset verification, not during Step 3
- Handlers that need existing DB state (totalSupply, ownedAssets) must accumulate changes in-memory: read existing state once per asset, apply all batch transfers in-memory, write final result
- Add `ctx.removeEntity()` to BatchContext — pipeline handles batch deletes in Step 4 alongside upserts, keeping handlers pure

### Claude's Discretion

- Multicall3 batch size for decimals handler (V1 uses 100, Claude may optimize)
- Exact cleaned-up ID format for OwnedAsset and OwnedToken
- Loading skeleton and internal implementation details for pipeline changes
- Handler file naming and internal organization within existing conventions

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Summary

This research investigates the exact code, interfaces, and patterns needed to migrate four handler implementations (totalSupply, ownedAssets, decimals, formattedTokenId) to the V2 EntityHandler interface, add pipeline infrastructure changes (async handle, Step 5.5 hook, delete queue), and delete all legacy code.

The V2 EntityHandler interface already exists with `listensToBag` self-selection and the enrichment queue pattern. However, the current `handle()` signature is synchronous (`void`), and the pipeline has no mechanism for entity deletions or post-verification handler hooks. The four handlers being migrated have specific requirements that push beyond the current V2 interface: totalSupply and ownedAssets need async DB access, decimals needs to run after verification, and formattedTokenId needs handler dependency ordering.

The handlerHelpers.ts file already contains dead-code implementations of `updateTotalSupply()` and `updateOwnedAssets()` that closely match the V1 logic and were designed for this exact migration. The `removeEntity()` method already exists on BatchContext (used by populateHelpers). The main gaps are: (1) making handle() async, (2) adding a delete queue to BatchContext + pipeline, (3) adding a Step 5.5 post-verification hook, and (4) adding handler dependency ordering to the registry.

**Primary recommendation:** Start with infrastructure changes (async handle, delete queue, Step 5.5 hook, registry ordering), then port handlers in dependency order: totalSupply → ownedAssets → decimals → formattedTokenId.

## Standard Stack

No new dependencies required. This phase uses the existing V2 stack:

### Core

| Library               | Version           | Purpose                                                            | Why Standard                              |
| --------------------- | ----------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| TypeORM               | (project dep)     | Entity persistence, `findBy`, `upsert`, `remove`                   | Already used by V2 pipeline               |
| viem                  | (project dep)     | Address comparison, hex conversion                                 | Already used by all handlers              |
| @chillwhales/typeorm  | (project codegen) | Entity classes: TotalSupply, OwnedAsset, OwnedToken, NFT, Decimals | Generated from schema.graphql             |
| @chillwhales/abi      | (project codegen) | LSP7DigitalAsset.functions.decimals, Multicall3                    | Already used by decimals handler          |
| @lukso/lsp8-contracts | (project dep)     | LSP8DataKeys.LSP8TokenIdFormat                                     | Already used by lsp8TokenIdFormat handler |

### Supporting

| Library      | Purpose          | When to Use                                 |
| ------------ | ---------------- | ------------------------------------------- |
| uuid (v4)    | Generate IDs     | Not needed — handlers use deterministic IDs |
| typeorm `In` | Batch DB queries | `findBy(Entity, { id: In([...ids]) })`      |

## Architecture Patterns

### Current V2 File Structure

```
packages/indexer-v2/src/
├── core/
│   ├── types/
│   │   ├── handler.ts          # EntityHandler + HandlerContext interfaces
│   │   ├── batchContext.ts      # IBatchContext interface
│   │   ├── verification.ts     # EntityCategory, EnrichmentRequest
│   │   ├── entity.ts           # Entity, FKFields, WritableFields
│   │   ├── plugins.ts          # EventPlugin, IPluginRegistry
│   │   ├── metadata.ts         # FetchRequest, IMetadataWorkerPool
│   │   ├── subsquid.ts         # Context, Block, Log
│   │   └── index.ts            # Barrel export
│   ├── batchContext.ts          # BatchContext implementation
│   ├── pipeline.ts              # processBatch() — 6-step orchestrator
│   ├── registry.ts              # PluginRegistry — discovery + routing
│   ├── verification.ts          # createVerifyFn() — cache + Multicall3
│   ├── multicall.ts             # aggregate3StaticLatest()
│   ├── handlerHelpers.ts        # DEAD CODE: updateTotalSupply, updateOwnedAssets
│   ├── populateHelpers.ts       # LEGACY: populateByUP, populateByDA, etc.
│   └── persistHelpers.ts        # insertEntities, upsertEntities, etc.
├── handlers/
│   ├── lsp4TokenName.handler.ts # Example V2 handler (sync, listensToBag)
│   ├── lsp8TokenIdFormat.handler.ts
│   ├── decimals.handler.ts      # DEAD CODE: uses old interface
│   └── ...                      # 15+ other handlers already migrated
├── plugins/events/
│   ├── lsp7Transfer.plugin.ts   # Adds entities as 'LSP7Transfer' bag key
│   ├── lsp8Transfer.plugin.ts   # Adds entities as 'LSP8Transfer' bag key
│   └── ...
└── utils/index.ts               # formatTokenId NOT present yet, decodeTokenIdFormat EXISTS
```

### Pattern 1: Standard V2 EntityHandler (sync, data-key based)

**What:** Most handlers filter DataChanged events by data key, create derived entities, queue enrichment
**When to use:** Handlers that don't need DB access or async operations
**Example:** (from lsp4TokenName.handler.ts)

```typescript
const LSP4TokenNameHandler: EntityHandler = {
  name: 'lsp4TokenName',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);
    for (const event of events.values()) {
      if (event.dataKey !== LSP4_TOKEN_NAME_KEY) continue;
      const entity = new LSP4TokenName({ /* ... */ digitalAsset: null });
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);
      hctx.batchCtx.queueEnrichment<LSP4TokenName>({
        /* ... */
      });
    }
  },
};
```

### Pattern 2: Transfer-derived EntityHandler (async, DB access, in-memory accumulation)

**What:** Handlers that listen to Transfer bag keys, need DB state, accumulate changes in-memory
**When to use:** totalSupply, ownedAssets — they must read existing state, apply all batch changes, write once
**Example pattern:** (from handlerHelpers.ts — dead code to be migrated)

```typescript
const TotalSupplyHandler: EntityHandler = {
  name: 'totalSupply',
  listensToBag: ['LSP7Transfer', 'LSP8Transfer'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const transfers = [...hctx.batchCtx.getEntities<Transfer>(triggeredBy).values()];
    // Filter for mint/burn only
    const mintBurnTransfers = transfers.filter(
      ({ from, to }) =>
        isAddressEqual(zeroAddress, getAddress(from)) ||
        isAddressEqual(zeroAddress, getAddress(to)),
    );
    if (mintBurnTransfers.length === 0) return;

    // Collect unique addresses, load existing from DB
    const addresses = [...new Set(mintBurnTransfers.map((t) => t.address))];
    const existing = await hctx.store.findBy(TotalSupply, { id: In(addresses) });
    const existingMap = new Map(existing.map((e) => [e.id, e]));

    // Accumulate in-memory, write to BatchContext
    for (const transfer of mintBurnTransfers) {
      /* ... */
    }
    for (const [id, entity] of updatedEntities) {
      hctx.batchCtx.addEntity('TotalSupply', id, entity);
    }
    // Queue enrichment for digitalAsset FK
  },
};
```

### Pattern 3: Post-verification EntityHandler (Step 5.5)

**What:** Handlers that need verified entity data to run — decimals needs newly verified Digital Assets
**When to use:** Decimals handler — it must read `batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities`
**Key difference:** Runs AFTER Step 5 (VERIFY) instead of Step 3 (HANDLE)

### Pattern 4: Handler with dependency ordering

**What:** FormattedTokenId handler depends on LSP8TokenIdFormat handler completing first
**When to use:** When one handler consumes data produced by another handler in the same step
**Implementation:** Registry stores handler dependencies and sorts execution order topologically

### Anti-Patterns to Avoid

- **Direct store operations in handlers:** Handlers should only write to BatchContext. The pipeline handles persistence.
- **Adding entities to raw type keys:** BatchContext seals raw types after Step 2. Handlers MUST use new type keys.
- **Ignoring enrichment queue for FKs:** Never set FKs directly on entities — always queue enrichment for deferred resolution.

## Don't Hand-Roll

| Problem                    | Don't Build             | Use Instead                                                                              | Why                                                            |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Token ID formatting        | Custom conversion logic | Port V1's `formatTokenId()` from `packages/indexer/src/utils/index.ts:62-82`             | 4 format cases + legacy format codes already handled correctly |
| Total supply accumulation  | New accumulation logic  | Adapt `handlerHelpers.ts:updateTotalSupply()` (already in V2 as dead code)               | Complex mint+burn-in-same-batch edge case already handled      |
| Owned asset/token tracking | New tracking logic      | Adapt `handlerHelpers.ts:updateOwnedAssets()` (already in V2 as dead code)               | Delete-vs-save logic, parent FK linking already handled        |
| Multicall3 batching        | Custom batching         | Use existing `core/multicall.ts:aggregate3StaticLatest()`                                | Already wraps raw eth_call with proper encoding/decoding       |
| ID generation              | New ID formats          | Port V1's `generateOwnedAssetId()`, `generateOwnedTokenId()` already in `utils/index.ts` | Already exist in V2, just need format change                   |

**Key insight:** The `handlerHelpers.ts` file contains 335 lines of fully working totalSupply + ownedAssets logic that was specifically designed for this migration. It's marked `@deprecated` / `Dead code — will be refactored into a standalone EntityHandler in #105`. The migration is a structural refactor, not a logic rewrite.

## Common Pitfalls

### Pitfall 1: Handler called twice for same entity type

**What goes wrong:** totalSupply and ownedAssets listen to BOTH `LSP7Transfer` and `LSP8Transfer`. The handler's `handle()` method is called once per matching bag key. If both LSP7 and LSP8 transfers exist in the same batch, the handler runs twice.
**Why it happens:** The pipeline iterates `handler.listensToBag` and calls `handle()` for each key that has entities.
**How to avoid:** Each call to `handle()` processes ONLY the transfers from `triggeredBy`. The handler loads existing state from DB, accumulates changes, and writes to BatchContext. Since BatchContext uses `addEntity(type, id, entity)` with the same derived type key (e.g., 'TotalSupply'), the second call's DB read will NOT see the first call's BatchContext changes (they haven't been persisted yet). The in-memory state from the first call is lost.
**Solution:** Either (a) the handler must read BatchContext entities from its own derived type key AND the DB, or (b) use a single call approach — listen to a common bag key or combine both Transfer types before processing.
**Warning signs:** TotalSupply values that are off by the amount from one transfer type.

### Pitfall 2: Entity deletion timing with enrichment queue

**What goes wrong:** A handler deletes an OwnedAsset (balance=0) from BatchContext. Later, the enrichment queue tries to set FKs on that entity. The entity isn't found → enrichment silently skips.
**Why it happens:** Enrichment queue references (entityType, entityId) that may no longer exist.
**How to avoid:** Per user decision: log at debug level when enrichment targets a deleted entity. This is expected behavior, not an error. The pipeline should check `entities.get(entityId)` and skip gracefully.
**Warning signs:** Debug logs showing "entity not found for enrichment" — expected for deleted OwnedAssets.

### Pitfall 3: Step 5.5 hook must run AFTER core entity persistence

**What goes wrong:** Decimals handler reads `batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities` to get newly created DigitalAssets. But if core entities haven't been persisted yet, the decimals entities can't reference them.
**Why it happens:** Step 5 verifies addresses and creates core entity instances. Core entities are persisted at the end of Step 5 (the pipeline already does `await context.store.upsert(allNewEntities)`). Step 5.5 must run AFTER this persistence, not just after verification.
**How to avoid:** Place Step 5.5 hook after the existing core entity persistence code (line 378 of pipeline.ts), before Step 6.
**Warning signs:** Foreign key constraint violations when inserting Decimals entities.

### Pitfall 4: OwnedAsset/OwnedToken deletion order matters

**What goes wrong:** OwnedToken has a FK reference to OwnedAsset (`ownedAsset` field). If OwnedAsset is deleted before OwnedToken, FK constraint violation.
**Why it happens:** TypeORM enforces FK constraints.
**How to avoid:** V1 uses specific order: (1) upsert OwnedAssets, (2) remove OwnedTokens, (3) remove OwnedAssets, (4) upsert OwnedTokens. The pipeline's Step 4 must handle this ordering, or the handler must queue deletions with explicit ordering hints.
**Warning signs:** FK constraint errors in batch processing.

### Pitfall 5: ID format change breaks enrichment queue references

**What goes wrong:** User decided to change ID format from `"{owner} - {address}"` to `"{owner}:{address}"`. If enrichment requests reference old format IDs, they won't find the entities.
**Why it happens:** Enrichment requests use `entityId` which must match the entity's actual ID.
**How to avoid:** The handler generates the entity ID AND the enrichment request entityId — as long as both use the same format function, they'll match. But OwnedToken has a FK to OwnedAsset, and the OwnedAsset ID must be generated consistently.
**Warning signs:** Enrichment queue "entity not found" warnings for OwnedAsset entities.

### Pitfall 6: FormattedTokenId retroactive update requires DB query

**What goes wrong:** When LSP8TokenIdFormat changes, ALL existing NFTs for that contract must be reformatted. If the handler only processes BatchContext NFTs, existing DB NFTs are missed.
**Why it happens:** V1 queries `context.store.findBy(NFT, { address: In([...addresses]) })` to get ALL NFTs for the affected contracts.
**How to avoid:** The handler must use `hctx.store.findBy()` to load existing NFTs from DB, reformat them, and add them to BatchContext for persistence.
**Warning signs:** Old NFTs retaining stale `formattedTokenId` values after format changes.

### Pitfall 7: Pipeline handler invocation is currently synchronous

**What goes wrong:** The pipeline at line 235 calls `handler.handle(handlerCtx, bagKey)` without `await`. If handle() returns a Promise, it's silently ignored.
**Why it happens:** Current interface defines `handle()` as returning `void`, and the pipeline doesn't await it.
**How to avoid:** When changing the interface to `Promise<void>`, the pipeline MUST also be updated to `await handler.handle(handlerCtx, bagKey)`.
**Warning signs:** Handlers appear to complete instantly, DB operations never execute, no errors thrown.

## Code Examples

### Exact V1 formatTokenId logic to port

```typescript
// Source: packages/indexer/src/utils/index.ts:62-82
export function formatTokenId({
  tokenId,
  lsp8TokenIdFormat,
}: {
  tokenId: Hex;
  lsp8TokenIdFormat?: LSP8TokenIdFormatEnum;
}) {
  switch (lsp8TokenIdFormat) {
    case LSP8TokenIdFormatEnum.NUMBER:
      return hexToNumber(tokenId).toString();
    case LSP8TokenIdFormatEnum.STRING:
      return hexToString(bytesToHex(hexToBytes(tokenId).filter((byte) => byte !== 0)));
    case LSP8TokenIdFormatEnum.ADDRESS:
      return sliceHex(tokenId, 12);
    case LSP8TokenIdFormatEnum.BYTES32:
      return tokenId;
    default:
      return tokenId; // V2: return null instead + log warning per user decision
  }
}
```

### Exact V1 formattedTokenId population logic (retroactive update)

```typescript
// Source: packages/indexer/src/utils/entityPopulation.ts:339-416
// Two paths:
// 1. New NFTs without formattedTokenId — look up existing LSP8TokenIdFormat from DB + batch
// 2. New LSP8TokenIdFormat changes — query ALL NFTs for affected contracts from DB, reformat

// Path 1: Populate new NFTs
const lsp8TokenIdFormats = [
  ...(await context.store.findBy(LSP8TokenIdFormat, {
    address: In([...new Set(nftsWithoutFormat.map(({ address }) => address))]),
  })),
  ...newLsp8TokenIdFormatEntities, // from current batch
];

for (const nft of nftsWithoutFormat) {
  const latest = lsp8TokenIdFormats
    .filter((f) => f.address === nft.address)
    .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];
  nft.formattedTokenId = isHex(nft.tokenId)
    ? formatTokenId({ tokenId: nft.tokenId, lsp8TokenIdFormat: latest?.value || null })
    : null;
}

// Path 2: Retroactive update when format changes
const existingNfts = await context.store.findBy(NFT, {
  address: In([...new Set(newFormats.map((f) => f.address))]),
  id: Not(In([...alreadyUpdatedIds])),
});
for (const format of newFormats) {
  for (const nft of existingNfts.filter((n) => n.address === format.address)) {
    nft.formattedTokenId = isHex(nft.tokenId)
      ? formatTokenId({ tokenId: nft.tokenId, lsp8TokenIdFormat: format.value })
      : null;
  }
}
```

### Exact current pipeline handler invocation (Step 3)

```typescript
// Source: packages/indexer-v2/src/core/pipeline.ts:232-238
for (const handler of registry.getAllEntityHandlers()) {
  for (const bagKey of handler.listensToBag) {
    if (batchCtx.hasEntities(bagKey)) {
      handler.handle(handlerCtx, bagKey); // NOT awaited — must change to await
    }
  }
}
```

### Existing ID generation functions (V2)

```typescript
// Source: packages/indexer-v2/src/utils/index.ts:167-193
// Current format uses " - " separator
export function generateOwnedAssetId({ owner, address }) {
  return `${owner} - ${address}`; // User wants: `${owner}:${address}`
}
export function generateOwnedTokenId({ owner, address, tokenId }) {
  return `${owner} - ${address} - ${tokenId}`; // User wants cleaner format
}
```

### Existing dead-code totalSupply handler (V2 handlerHelpers.ts)

```typescript
// Source: packages/indexer-v2/src/core/handlerHelpers.ts:48-115
// Already implements: mint/burn filtering, DB load, in-memory accumulation,
// underflow clamping to 0, batch upsert. This is the logic to extract into
// a standalone EntityHandler.
```

### Existing dead-code ownedAssets handler (V2 handlerHelpers.ts)

```typescript
// Source: packages/indexer-v2/src/core/handlerHelpers.ts:148-334
// Already implements: sender decrement with floor at 0, receiver increment,
// new holder creation with UP FK, OwnedToken create/null for NFTs,
// zero-balance deletion, null-tokenId deletion, parent FK linking,
// correct DB operation ordering.
```

### Existing V2 decimals handler (dead code, old interface)

```typescript
// Source: packages/indexer-v2/src/handlers/decimals.handler.ts
// Uses OLD interface: listensTo: [EntityCategory.DigitalAsset], events: ['create']
// Reads batchCtx.getVerified(triggeredBy).newEntities
// Uses aggregate3StaticLatest with BATCH_SIZE = 100
// Creates Decimals entities with store.insert()
// Needs: new interface + runs in Step 5.5 instead of Step 3
```

## Detailed Infrastructure Changes Required

### 1. EntityHandler interface: async handle()

**File:** `packages/indexer-v2/src/core/types/handler.ts`

**Current (line 65):**

```typescript
handle(hctx: HandlerContext, triggeredBy: string): void;
```

**Required:**

```typescript
handle(hctx: HandlerContext, triggeredBy: string): void | Promise<void>;
```

**Impact:** All 15+ existing handlers return `void` — this is backward compatible. Pipeline must be updated to `await` the result.

### 2. Pipeline: await handler.handle()

**File:** `packages/indexer-v2/src/core/pipeline.ts` (line 235)

**Current:**

```typescript
handler.handle(handlerCtx, bagKey);
```

**Required:**

```typescript
await handler.handle(handlerCtx, bagKey);
```

### 3. Pipeline: delete queue support in Step 4

**Concept:** Handlers mark entities for deletion by adding them to a new delete queue on BatchContext. The pipeline processes deletions in Step 4 with proper ordering.

**Option A (Recommended): Add deleteQueue to BatchContext**

```typescript
// IBatchContext additions:
queueDelete(entityClass: EntityConstructor<T>, entities: T[]): void;
getDeleteQueue(): ReadonlyArray<{ entityClass: EntityConstructor<Entity>; entities: Entity[] }>;

// Pipeline Step 4 processes deletions before upserts (for FK ordering)
```

**Option B: Use removeEntity + track removals**

The `removeEntity()` already exists but only removes from the BatchContext bag — it doesn't trigger DB deletion. For entities that were already persisted in a previous batch, we need actual DB deletes.

**Decision note:** The user said "Add `ctx.removeEntity()` to BatchContext — pipeline handles batch deletes in Step 4 alongside upserts, keeping handlers pure." Since `removeEntity()` already exists, this likely means adding a separate mechanism for DB deletions. The handler marks entities for deletion (via a new queue), and the pipeline executes the DB removes in Step 4.

### 4. Pipeline: Step 5.5 post-verification handler hook

**File:** `packages/indexer-v2/src/core/pipeline.ts`

**Location:** After line 378 (core entity persistence), before line 381 (Step 6: ENRICH)

**Concept:** Add a new `postVerification` property to EntityHandler (optional). Handlers with this flag run in Step 5.5 instead of Step 3.

```typescript
// EntityHandler addition:
readonly postVerification?: boolean; // If true, runs in Step 5.5 instead of Step 3
```

**Alternative:** Separate interface/array in registry for post-verification handlers.

### 5. Registry: handler dependency ordering

**File:** `packages/indexer-v2/src/core/registry.ts`

**Concept:** FormattedTokenId declares it depends on lsp8TokenIdFormat. The registry topologically sorts handlers.

```typescript
// EntityHandler addition:
readonly dependsOn?: string[]; // Handler names this handler must run after

// Registry sorts getAllEntityHandlers() by dependency order
```

**Current behavior:** `getAllEntityHandlers()` returns handlers in insertion order. Discovery reads filesystem order. With dependency ordering, the registry must topologically sort.

### 6. Files to delete (legacy code cleanup)

| File                      | Purpose                                                      | Why Delete                            |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `core/handlerHelpers.ts`  | Dead code: updateTotalSupply, updateOwnedAssets              | Logic migrated to standalone handlers |
| `core/populateHelpers.ts` | Legacy populate pattern: populateByUP, populateByDA, etc.    | Replaced by enrichment queue          |
| `core/persistHelpers.ts`  | Legacy persist pattern: insertEntities, upsertEntities, etc. | Pipeline handles persistence directly |

**Verification:** Check that no other files import from these modules before deleting.

## Entity Schemas (from schema.graphql)

### TotalSupply

```graphql
type TotalSupply @entity {
  id: ID! @unique # = contract address
  timestamp: DateTime! @index
  address: String! @index
  digitalAsset: DigitalAsset! @index @unique # FK to DigitalAsset
  value: BigInt! @index
}
```

### Decimals

```graphql
type Decimals @entity {
  id: ID! @unique # = contract address
  address: String! @index
  digitalAsset: DigitalAsset! @index @unique # FK to DigitalAsset
  value: Int! @index
}
```

### NFT

```graphql
type NFT @entity @index(fields: ["tokenId", "digitalAsset"]) {
  id: ID! @unique # = "{address} - {tokenId}"
  tokenId: String! @index
  formattedTokenId: String @index # nullable — populated by FormattedTokenId handler
  address: String! @index
  digitalAsset: DigitalAsset @index # FK
  lsp4Metadata: LSP4Metadata @index # FK (not in this phase)
  lsp4MetadataBaseUri: LSP4Metadata @index # FK (not in this phase)
  isMinted: Boolean! @index
  isBurned: Boolean! @index
}
```

### OwnedAsset

```graphql
type OwnedAsset @entity @index(fields: ["address", "owner"]) {
  id: ID! @unique # V1: "{owner} - {address}", V2: "{owner}:{address}"
  block: Int! @index
  timestamp: DateTime! @index
  balance: BigInt! @index
  address: String! @index
  owner: String! @index
  digitalAsset: DigitalAsset @index # FK
  universalProfile: UniversalProfile @index # FK
}
```

### OwnedToken

```graphql
type OwnedToken @entity @index(fields: ["address", "tokenId", "owner"]) {
  id: ID! @unique # V1: "{owner} - {address} - {tokenId}", V2: cleaner
  block: Int! @index
  timestamp: DateTime! @index
  tokenId: String! @index
  address: String! @index
  owner: String! @index
  nft: NFT @index @unique # FK
  digitalAsset: DigitalAsset @index # FK
  universalProfile: UniversalProfile @index # FK
  ownedAsset: OwnedAsset @index # FK to parent OwnedAsset
}
```

## Transfer Entity Bag Keys

The LSP7 and LSP8 transfer plugins use DIFFERENT bag keys:

- LSP7Transfer plugin → bag key: `'LSP7Transfer'`
- LSP8Transfer plugin → bag key: `'LSP8Transfer'`

Both contain `Transfer` entity instances but under different keys. This is critical for handler `listensToBag` configuration.

## Open Questions

1. **Delete queue vs removeEntity semantics**

   - What we know: `removeEntity()` exists and removes from in-memory BatchContext. But for OwnedAsset/OwnedToken deletion, we need DB-level deletes of entities that may have been persisted in prior batches.
   - What's unclear: Should the handler call `store.remove()` directly (breaking "handlers only write to BatchContext" principle), or should there be a new delete queue on BatchContext that the pipeline processes?
   - Recommendation: Add a `queueDelete()` method to BatchContext (similar to `queueClear()` which already exists for sub-entity deletion). The pipeline processes the delete queue in Step 4 with correct FK ordering.

2. **Handler dual-trigger accumulation**

   - What we know: totalSupply handler listens to both `LSP7Transfer` and `LSP8Transfer`. The pipeline calls `handle()` separately for each. Between calls, the handler's BatchContext entities exist but haven't been persisted.
   - What's unclear: Should the handler accumulate across both calls by reading its own derived type key from BatchContext?
   - Recommendation: Yes — the handler should read from both DB (via `store.findBy`) AND BatchContext (via `batchCtx.getEntities('TotalSupply')`) to get the most current state. This handles the case where LSP7 mints and LSP8 burns affect the same contract in one batch.

3. **FormattedTokenId: dependency on NFT entities in BatchContext vs DB**

   - What we know: FormattedTokenId needs to know which NFTs exist. New NFTs are created by the NFT handler (already exists as a separate handler in V2, not part of this phase). Existing NFTs are in the DB.
   - What's unclear: Will the NFT handler have already run before FormattedTokenId? The NFT handler listens to `LSP8Transfer` and creates NFT entities in BatchContext.
   - Recommendation: The dependency ordering system handles this — FormattedTokenId declares `dependsOn: ['lsp8TokenIdFormat']`. But it also implicitly depends on NFT entities being in BatchContext. If the NFT handler hasn't been created yet, FormattedTokenId should query the DB for NFTs. Check if the NFT handler already exists in V2.

4. **Import cleanup after legacy deletion**
   - What we know: `core/index.ts` re-exports from handlerHelpers, populateHelpers, persistHelpers.
   - What's unclear: Other handlers might import from these barrel exports.
   - Recommendation: Grep for all imports before deleting. Update `core/index.ts` barrel export.

## Sources

### Primary (HIGH confidence)

- Direct codebase analysis: All V1 and V2 source files read directly
- `packages/indexer-v2/src/core/types/handler.ts` — current EntityHandler interface
- `packages/indexer-v2/src/core/batchContext.ts` — current BatchContext implementation (removeEntity exists at line 115)
- `packages/indexer-v2/src/core/pipeline.ts` — current 6-step pipeline (468 lines)
- `packages/indexer-v2/src/core/registry.ts` — current PluginRegistry (252 lines)
- `packages/indexer-v2/src/core/handlerHelpers.ts` — dead code with exact logic to migrate (335 lines)
- `packages/indexer/src/utils/index.ts` — V1 formatTokenId (line 62-82)
- `packages/indexer/src/utils/entityPopulation.ts` — V1 formattedTokenId population (line 339-416)
- `packages/indexer/src/app/handlers/decimalsHandler.ts` — V1 decimals handler
- `packages/indexer/src/app/handlers/totalSupplyHandler.ts` — V1 totalSupply handler
- `packages/indexer/src/app/handlers/ownedAssetsHandler.ts` — V1 ownedAssets handler
- `packages/typeorm/schema.graphql` — entity schemas

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — patterns directly observed from existing V2 handlers and pipeline code
- Pitfalls: HIGH — identified from exact code analysis of edge cases in V1 and V2 implementations
- Infrastructure changes: HIGH — specific line numbers and code snippets from codebase
- Legacy code deletion: MEDIUM — need to verify no remaining imports before deleting

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable — internal codebase, no external dependency changes expected)