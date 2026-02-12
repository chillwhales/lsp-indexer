# Testing Patterns

**Analysis Date:** 2026-02-12

## Test Framework

**Runner:**

- Vitest 2.1.8 (in `packages/indexer-v2` only)
- Config: `packages/indexer-v2/vitest.config.ts`
- Globals enabled (`describe`, `it`, `expect` available without import)
- Environment: `node`
- Setup file: `packages/indexer-v2/vitest.setup.ts` (registers `@/*` path alias for CJS `require()` calls)

**Assertion Library:**

- Vitest built-in `expect()` assertions
- Vitest `vi` mock utilities (`vi.fn()`, `vi.mock()`, `vi.spyOn()`, `vi.mocked()`)

**Run Commands:**

```bash
pnpm --filter=@chillwhales/indexer-v2 test        # Run all tests (builds first via pretest)
pnpm --filter=@chillwhales/indexer-v2 test:watch   # Watch mode (vitest without --run)
```

**Important:** The `pretest` script runs `pnpm build` before tests. Integration tests import from `@/` which resolves to `lib/` (compiled output), so a build is required before running tests.

## Test File Organization

**Location:**

- Unit tests: co-located in `__tests__/` directories next to source
- Integration tests: `packages/indexer-v2/test/integration/`
- Test fixtures: `packages/indexer-v2/test/fixtures/blocks/`

**Naming:**

- All test files: `{module}.test.ts`

**Structure:**

```
packages/indexer-v2/
├── src/
│   ├── core/
│   │   └── __tests__/
│   │       ├── pipeline.test.ts           # Pipeline step tests (1038 lines)
│   │       ├── batchContext.test.ts        # BatchContext unit tests (248 lines)
│   │       ├── logger.test.ts             # Logger/DualLogger tests (236 lines)
│   │       └── metadataWorkerPool.test.ts # Worker pool tests (630 lines)
│   └── handlers/
│       └── __tests__/
│           ├── totalSupply.handler.test.ts          # TotalSupply handler (235 lines)
│           ├── ownedAssets.handler.test.ts           # OwnedAssets handler (639 lines)
│           ├── follower.handler.test.ts              # Follower handler (326 lines)
│           ├── lsp6Controllers.handler.test.ts       # LSP6 permissions handler
│           ├── lsp4MetadataFetch.handler.test.ts     # LSP4 metadata fetch handler
│           ├── lsp3ProfileFetch.handler.test.ts      # LSP3 profile fetch handler
│           └── lsp29EncryptedAssetFetch.handler.test.ts # LSP29 encrypted asset handler
├── test/
│   ├── integration/
│   │   └── pipeline.test.ts               # Full pipeline integration (458 lines)
│   └── fixtures/
│       └── blocks/
│           ├── transfer-lsp7.json         # LSP7 transfer fixture
│           ├── transfer-lsp8.json         # LSP8 transfer fixture
│           ├── multi-event.json           # Multi-event block fixture
│           └── README.md                  # Fixture documentation
└── vitest.config.ts
```

## Test Structure

**Suite Organization:**

```typescript
// Tests organized by pipeline steps with section separator comments
// ---------------------------------------------------------------------------
// Step 1: EXTRACT
// ---------------------------------------------------------------------------
describe('Pipeline Step 1: EXTRACT', () => {
  it('should route logs to correct plugins by topic0', async () => {
    // Arrange: create registry, plugins, mocks
    // Act: call processBatch()
    // Assert: verify mock calls
  });
});
```

**Handler Test Organization:**

```typescript
describe('TotalSupplyHandler', () => {
  describe('FK field preservation', () => {
    it('preserves digitalAsset FK field during mint reconstruction (regression test for #146)', async () => {
      // ...
    });
  });
});
```

**Patterns:**

- Describe blocks mirror pipeline stages or handler behaviors
- Test descriptions use `should {verb}` or `{verb}s {thing}` patterns
- Regression tests reference issue numbers: `(regression test for #146)`
- Test IDs reference test plan codes: `HNDL-01`, `HNDL-02`, `META-02`, `INTG-04`

## Mocking

**Framework:** Vitest `vi.fn()`, `vi.mock()`, `vi.spyOn()`

**Mock Store Pattern:**

```typescript
// From packages/indexer-v2/src/core/__tests__/pipeline.test.ts
interface MockStore extends Store {
  readonly insertedEntities: EntityRecord[];
  readonly upsertedEntities: EntityRecord[];
}

function createMockStore(): MockStore {
  const insertedEntities: EntityRecord[] = [];
  const upsertedEntities: EntityRecord[] = [];
  const baseStore: Partial<Store> = {
    insert: vi.fn(<T extends EntityRecord>(entities: T[]) => {
      insertedEntities.push(...entities);
      return Promise.resolve();
    }),
    upsert: vi.fn(<T extends EntityRecord>(entities: T[]) => {
      upsertedEntities.push(...entities);
      return Promise.resolve();
    }),
  };
  return Object.assign(baseStore, { insertedEntities, upsertedEntities }) as MockStore;
}
```

**Mock BatchContext Pattern (for handler tests):**

```typescript
// From packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts
function createMockBatchCtx() {
  const entityBags = new Map<string, Map<string, unknown>>();
  const deleteQueue: unknown[] = [];
  const enrichmentQueue: unknown[] = [];
  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    addEntity: vi.fn((type: string, id: string, entity: unknown) => {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      entityBags.get(type).set(id, entity);
    }),
    queueDelete: vi.fn((request: unknown) => deleteQueue.push(request)),
    queueEnrichment: vi.fn((request: unknown) => enrichmentQueue.push(request)),
    // Test accessors for assertions
    _entityBags: entityBags,
    _deleteQueue: deleteQueue,
    _enrichmentQueue: enrichmentQueue,
  };
}
```

**Mock Context Pattern:**

```typescript
function createMockContext(store: Store, blocks: Block[] = [mockBlock]): Context {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  mockLogger.child = vi.fn(() => ({ ...mockLogger }));
  return { blocks, store, log: mockLogger, isHead: false } as unknown as Context;
}
```

**Module Mocking (worker_threads):**

```typescript
// From packages/indexer-v2/src/core/__tests__/metadataWorkerPool.test.ts
vi.mock('worker_threads', () => ({
  Worker: vi.fn().mockImplementation(() => {
    const worker = {
      postMessage: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'message') worker._triggerMessage = (results) => handler(results);
        // ... other events
      }),
    };
    mockWorkerInstances.push(worker);
    return worker;
  }),
}));
```

**What to Mock:**

- Subsquid `Store` (insert/upsert/findBy/find/remove operations)
- Subsquid `Context` object (blocks, store, log, isHead)
- Verification functions (`verifyAddresses`)
- Worker pools (`fetchBatch`, `shutdown`)
- Node.js `worker_threads` module
- Logger module (`getFileLogger`)
- Handler helper modules (`mergeEntitiesFromBatchAndDb`)

**What NOT to Mock:**

- Core domain logic: `BatchContext`, `PluginRegistry`, `processBatch` (tested with real implementations)
- Entity construction (uses real TypeORM entities from `@chillwhales/typeorm`)
- Utility functions (`generateTokenId`, `generateFollowId`, etc.)

## Fixtures and Factories

**JSON Fixtures (Integration Tests):**

- Location: `packages/indexer-v2/test/fixtures/blocks/`
- Files: `transfer-lsp7.json`, `transfer-lsp8.json`, `multi-event.json`
- Loaded at module level: `const lsp7TransferFixture = loadFixture('transfer-lsp7.json')`
- Contain real blockchain block data with logs for deterministic testing

**Inline Fixtures (Unit Tests):**

```typescript
// Block fixture
const mockBlock: Block = {
  header: { id: 'block-1000', height: 1000, hash: '0xblockhash', ... },
} as Block;

// Log factory
const mockLog = (topic0: string, address = '0xcontract'): Log =>
  ({ id: 'log-0', address, topics: [topic0], data: '0x', ... }) as Log;
```

**Entity Factory Functions (Handler Tests):**

```typescript
// From packages/indexer-v2/src/handlers/__tests__/totalSupply.handler.test.ts
function createTransfer({
  from,
  to,
  amount,
  address,
  timestamp,
}: {
  from: string;
  to: string;
  amount: bigint;
  address?: string;
  timestamp?: Date;
}): Transfer {
  return new Transfer({
    id: uuidv4(),
    blockNumber: 100,
    logIndex: 1,
    transactionIndex: 1,
    timestamp,
    address,
    from,
    to,
    amount,
    tokenId: null,
    operator: from,
    force: false,
    data: '0x',
    digitalAsset: null,
    fromProfile: null,
    toProfile: null,
    operatorProfile: null,
    nft: null,
  });
}
```

**Pattern for Override Factories:**

```typescript
// From packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts
function createFollow(overrides: Partial<Follow> = {}): Follow {
  return new Follow({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    // ... defaults
    ...overrides,
  });
}
```

## Coverage

**Requirements:** None enforced. No coverage configuration.

**View Coverage:**

```bash
# No coverage commands configured
# Could add: vitest run --coverage
```

## Test Types

**Unit Tests (11 files):**

- `packages/indexer-v2/src/core/__tests__/batchContext.test.ts` - BatchContext entity storage, sealing, enrichment queue
- `packages/indexer-v2/src/core/__tests__/logger.test.ts` - Step logger, component logger, dual logger, file logger init
- `packages/indexer-v2/src/core/__tests__/metadataWorkerPool.test.ts` - Worker dispatch, retry, crash recovery, shutdown
- `packages/indexer-v2/src/core/__tests__/pipeline.test.ts` - All 6 pipeline steps individually + integration flow
- `packages/indexer-v2/src/handlers/__tests__/totalSupply.handler.test.ts` - Mint/burn accumulation, FK preservation
- `packages/indexer-v2/src/handlers/__tests__/ownedAssets.handler.test.ts` - LSP7/LSP8 ownership tracking, balance, deletion
- `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts` - Follow/unfollow entity creation and deletion
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts` - LSP6 permission sub-entity lifecycle
- `packages/indexer-v2/src/handlers/__tests__/lsp4MetadataFetch.handler.test.ts` - LSP4 metadata sub-entity creation
- `packages/indexer-v2/src/handlers/__tests__/lsp3ProfileFetch.handler.test.ts` - LSP3 profile metadata fetch
- `packages/indexer-v2/src/handlers/__tests__/lsp29EncryptedAssetFetch.handler.test.ts` - LSP29 encrypted asset fetch

**Integration Tests (1 file):**

- `packages/indexer-v2/test/integration/pipeline.test.ts` - Full pipeline with real plugin/handler discovery from compiled `lib/` directory
  - Tests registry auto-discovery of plugins and handlers
  - Tests LSP7/LSP8 transfer processing through all 6 pipeline steps
  - Tests multi-event block processing
  - Tests handler dependency ordering (topological sort)
  - Uses JSON block fixtures for deterministic replay
  - **Requires `pnpm build` before running** (imports from `lib/`)

**E2E Tests:**

- Not present. No database or RPC integration tests.

## Common Patterns

**Async Testing:**

```typescript
it('should persist all raw event entities via store.insert()', async () => {
  const store = createMockStore();
  const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);
  await processBatch(context, {
    registry,
    verifyAddresses: createMockVerifyFn(),
    workerPool: mockWorkerPool,
  });
  expect(store.insertedEntities).toContainEqual({ id: 'e1', type: 'event1' });
});
```

**Error Testing:**

```typescript
it('should throw if handler tries to add entity to raw entity type key', async () => {
  await expect(
    processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    }),
  ).rejects.toThrow(/Handler attempted to add entity to raw type 'RawEvent'/);
});
```

**Fake Timers (Worker Pool Tests):**

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
// Flush microtask queue
async function tick(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}
```

**Environment Variable Testing (Logger Tests):**

```typescript
const originalEnv = { ...process.env };
beforeEach(() => {
  _resetFileLogger();
});
afterEach(() => {
  process.env = { ...originalEnv };
  _resetFileLogger();
});

it('respects LOG_LEVEL env var override', () => {
  process.env.LOG_LEVEL = 'warn';
  initFileLogger('/tmp/test-logs-level');
  expect(getFileLogger().level).toBe('warn');
});
```

**State Verification Pattern:**

- Tests verify persistence by inspecting mock store tracking arrays (`insertedEntities`, `upsertedEntities`)
- Entity matching uses `find()` with property checks:
  ```typescript
  const enrichedTransfer = mockStore.upsertedEntities.find(
    (e) => e.id === 't1' && e.digitalAsset !== null,
  );
  expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda1' });
  ```

**Regression Test Pattern:**

```typescript
it('preserves digitalAsset FK field during mint reconstruction (regression test for #146)', async () => {
  // Simulate TypeORM behavior: delete FK property to test preservation
  delete (existingTotalSupply as any).digitalAsset;
  // ... run handler
  // Critical assertion: FK field must exist on reconstructed entity
  expect(reconstructed).toHaveProperty('digitalAsset');
  expect(reconstructed?.digitalAsset).toBeNull();
});
```

## Test Gaps

**No tests in other packages:**

- `packages/indexer/` (v1, legacy/read-only) - zero tests
- `packages/abi/` (codegen) - zero tests
- `packages/typeorm/` (codegen) - zero tests

**Missing test coverage in indexer-v2:**

- No tests for `packages/indexer-v2/src/core/registry.ts` discovery logic (auto-discovery from filesystem)
- No tests for `packages/indexer-v2/src/core/verification.ts` (on-chain supportsInterface calls)
- No tests for `packages/indexer-v2/src/core/multicall.ts` (multicall batching)
- No tests for event plugins (`packages/indexer-v2/src/plugins/events/`) - plugin extract() logic untested
- No tests for `packages/indexer-v2/src/utils/index.ts` utility functions
- No tests for `packages/indexer-v2/src/app/` modules (bootstrap, config, processor)
- No E2E tests against a real database
- No coverage enforcement or reporting

**CI gap:** No test job in `.github/workflows/ci.yml` - tests only run locally

## Adding New Tests

When adding a new handler test:

1. Create `packages/indexer-v2/src/handlers/__tests__/{handlerName}.handler.test.ts`
2. Import from `vitest`: `import { describe, expect, it, vi } from 'vitest'`
3. Import handler: `import MyHandler from '../myHandler.handler'`
4. Create mock helpers: `createMockBatchCtx()`, `createMockStore()`, `createMockHandlerContext()`
5. Use entity factory functions with `Partial<Entity>` overrides pattern
6. Test: entity creation, FK preservation, enrichment queuing, deletion queuing
7. Run: `pnpm --filter=@chillwhales/indexer-v2 test`

When adding a new core module test:

1. Create `packages/indexer-v2/src/core/__tests__/{module}.test.ts`
2. Follow existing patterns from `pipeline.test.ts` or `logger.test.ts`
3. Mock external dependencies (`Store`, `Context`, `Logger`) not core logic

---

_Testing analysis: 2026-02-12_
