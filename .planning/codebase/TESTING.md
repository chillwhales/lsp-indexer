# Testing Patterns

**Analysis Date:** 2026-02-06

## Test Framework

**Runner:**

- Vitest (used in indexer-v2 package only)
- No vitest config file detected; tests exist only as compiled `.js` files in `packages/indexer-v2/lib/core/__tests__/`
- No test runner is configured in any `package.json` scripts across the monorepo

**Assertion Library:**

- Vitest's built-in `expect()` assertions
- Vitest's `vi` mock utilities

**Run Commands:**

```bash
# No test commands exist in any package.json
# The indexer-v2 tests appear to have been compiled from a separate source
# that is not present in the repository (no src/ directory in indexer-v2)
```

## Test File Organization

**Location:**

- The only test files exist in `packages/indexer-v2/lib/core/__tests__/` (compiled JS only)
- No test files exist in the main `packages/indexer/` package
- No test files exist in `packages/abi/` or `packages/typeorm/`

**Naming:**

- `{module}.test.js` pattern: `pipeline.test.js`, `batchContext.test.js`

**Structure:**

```
packages/indexer-v2/
└── lib/
    └── core/
        └── __tests__/
            ├── pipeline.test.js      # Pipeline integration & step tests (~754 lines)
            ├── pipeline.test.d.ts    # Type declarations (empty export)
            ├── batchContext.test.js   # BatchContext unit tests (~199 lines)
            └── batchContext.test.d.ts # Type declarations (empty export)
```

## Test Structure

**Suite Organization:**

```typescript
// Tests organized by pipeline steps with clear separator comments
// ---------------------------------------------------------------------------
// Step 1: EXTRACT
// ---------------------------------------------------------------------------
describe('Pipeline Step 1: EXTRACT', () => {
  it('should route logs to correct plugins by topic0', async () => {
    // Arrange: create mocks
    // Act: call processBatch()
    // Assert: verify mock calls
  });
});
```

**Patterns:**

- Describe blocks map to pipeline stages: `Pipeline Step 1: EXTRACT`, `Pipeline Step 2: PERSIST RAW`, etc.
- Each describe block tests a specific phase of the 6-step processing pipeline
- Integration test at the end covers the full flow: `Pipeline Integration`
- Separate describe for `BatchContext` unit tests: `BatchContext - Enrichment Queue`, `BatchContext - Raw Entity Type Sealing`

## Mocking

**Framework:** Vitest's `vi.fn()` and `vi.mock()`

**Patterns:**

```typescript
// Mock store with tracking arrays
function createMockStore() {
  const insertedEntities: any[] = [];
  const upsertedEntities: any[] = [];
  const baseStore = {
    insert: vi.fn((entities: any[]) => {
      insertedEntities.push(...entities);
      return Promise.resolve();
    }),
    upsert: vi.fn((entities: any[]) => {
      upsertedEntities.push(...entities);
      return Promise.resolve();
    }),
  };
  return Object.assign(baseStore, { insertedEntities, upsertedEntities });
}

// Mock context matching Subsquid's DataHandlerContext shape
function createMockContext(store, blocks = [mockBlock]) {
  return {
    blocks,
    store,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    isHead: false,
  };
}

// Mock verification function
function createMockVerifyFn(validAddresses = new Set(), newAddresses = new Set()) {
  return vi.fn((category, addresses) => {
    const valid = new Set([...addresses].filter((addr) => validAddresses.has(addr)));
    const newSet = new Set([...addresses].filter((addr) => newAddresses.has(addr)));
    const invalid = new Set([...addresses].filter((addr) => !validAddresses.has(addr)));
    const newEntities = new Map();
    // ... create mock entities based on category
    return Promise.resolve({ new: newSet, valid, invalid, newEntities });
  });
}
```

**What to Mock:**

- The Subsquid `Store` (insert/upsert/findBy operations)
- The `Context` object (blocks, store, log)
- Verification functions (`verifyAddresses`)
- Worker pools (`fetchBatch`, `shutdown`)

**What NOT to Mock:**

- Core domain logic: `BatchContext`, `PluginRegistry`, `processBatch` (tested directly)
- Entity construction (uses real TypeORM entities from `@chillwhales/typeorm`)

## Fixtures and Factories

**Test Data:**

```typescript
// Block fixture
const mockBlock = {
  header: {
    id: 'block-1000',
    height: 1000,
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: Date.now(),
  },
};

// Log factory function
const mockLog = (topic0: string, address = '0xcontract') => ({
  id: 'log-0',
  address,
  topics: [topic0],
  data: '0x',
  logIndex: 0,
  transactionIndex: 0,
  block: mockBlock.header,
  getTransaction: () => ({ id: 'tx-0' }),
});
```

**Location:**

- Fixtures are defined inline at the top of test files (no shared fixture directory)
- Factory functions co-located with tests

## Coverage

**Requirements:** None enforced

**View Coverage:**

```bash
# No coverage configuration exists
```

## Test Types

**Unit Tests:**

- `batchContext.test.js`: Tests `BatchContext` class in isolation
  - Enrichment queue operations (add, retrieve, ordering)
  - Raw entity type sealing (add before seal, throw after seal)
  - Entity management (addEntity, hasEntities, getEntities)

**Integration Tests:**

- `pipeline.test.js`: Tests `processBatch()` with mocked dependencies
  - Step-by-step pipeline validation (6 steps: Extract → Persist Raw → Handle → Persist Derived → Verify → Enrich)
  - Full flow integration test combining all steps
  - Tests plugin routing, entity persistence, handler invocation, FK enrichment

**E2E Tests:**

- Not present

## Common Patterns

**Async Testing:**

```typescript
it('should execute all 6 steps correctly', async () => {
  // Setup plugins, handlers, registry
  const store = createMockStore();
  const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtransfer')] }]);

  await processBatch(context, {
    registry,
    verifyAddresses: createMockVerifyFn(new Set(['0xup1']), new Set(['0xup1'])),
    workerPool: mockWorkerPool,
  });

  // Assertions on store state
  expect(mockStore.insertedEntities.find((e) => e.id === 't1')).toBeDefined();
  expect(mockStore.upsertedEntities.find((e) => e.id === '0xup1')).toBeDefined();
});
```

**Error Testing:**

```typescript
it('should throw if handler tries to add entity to raw entity type key', async () => {
  // Setup handler that incorrectly adds to sealed type
  await expect(processBatch(context, opts)).rejects.toThrow(
    /Handler attempted to add entity to raw type 'RawEvent'/,
  );
});
```

**State Verification Pattern:**

- Tests verify persistence by inspecting mock store arrays (`insertedEntities`, `upsertedEntities`)
- Entity matching uses `find()` with property checks and `toMatchObject()` for partial assertions:
  ```typescript
  const enrichedTransfer = mockStore.upsertedEntities.find(
    (e) => e.id === 't1' && e.digitalAsset !== null,
  );
  expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda1' });
  ```

## Critical Gaps

**No Test Infrastructure in Main Packages:**

- The primary `packages/indexer/` package has **zero tests**
- The `packages/abi/` package has **zero tests** (codegen only)
- The `packages/typeorm/` package has **zero tests** (codegen only)
- No test runner, test config, or test scripts exist in any `package.json`

**indexer-v2 Tests Are Compiled Only:**

- Test source code is not present in the repository (no `packages/indexer-v2/src/` directory)
- Only compiled `.js` test files exist in `packages/indexer-v2/lib/core/__tests__/`
- These tests use Vitest but there is no `vitest` dependency in any `package.json`
- Tests cannot be run without the original source and proper configuration

**Implications for New Code:**

- When adding tests, install Vitest and create a `vitest.config.ts`
- Follow the existing test patterns from the indexer-v2 compiled tests (describe/it structure, mock factories)
- Place test files in `__tests__/` directories co-located with the modules they test
- Use `{module}.test.ts` naming convention
- Mock the Subsquid store and context following the patterns documented above

---

_Testing analysis: 2026-02-06_
