import { DigitalAsset, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { describe, expect, it, vi } from 'vitest';
import { processBatch } from '../pipeline';
import { PluginRegistry } from '../registry';
import {
  Block,
  Context,
  EntityCategory,
  EntityHandler,
  EventPlugin,
  IBatchContext,
  IMetadataWorkerPool,
  Log,
  VerificationResult,
} from '../types';

// ---------------------------------------------------------------------------
// Test fixtures and mocks
// ---------------------------------------------------------------------------

const mockBlock: Block = {
  header: {
    id: 'block-1000',
    height: 1000,
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: Date.now(),
  },
} as Block;

const mockLog = (topic0: string, address = '0xcontract'): Log =>
  ({
    id: 'log-0',
    address,
    topics: [topic0],
    data: '0x',
    logIndex: 0,
    transactionIndex: 0,
    block: mockBlock.header,
    getTransaction: () => ({ id: 'tx-0' }),
  }) as Log;

interface EntityRecord extends Record<string, unknown> {
  id: string;
}

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

  return Object.assign(baseStore, {
    insertedEntities,
    upsertedEntities,
  }) as MockStore;
}

function createMockContext(store: Store, blocks: Block[] = [mockBlock]): Context {
  return {
    blocks,
    store,
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    isHead: false,
  } as unknown as Context;
}

type MockVerifyFn = ReturnType<
  typeof vi.fn<[EntityCategory, Set<string>], Promise<VerificationResult>>
>;

function createMockVerifyFn(
  validAddresses: Set<string> = new Set(),
  newAddresses: Set<string> = new Set(),
): MockVerifyFn {
  return vi.fn((category: EntityCategory, addresses: Set<string>): Promise<VerificationResult> => {
    const valid = new Set([...addresses].filter((addr) => validAddresses.has(addr)));
    const newSet = new Set([...addresses].filter((addr) => newAddresses.has(addr)));
    const invalid = new Set([...addresses].filter((addr) => !validAddresses.has(addr)));

    const newEntities = new Map<string, { id: string }>();
    for (const addr of newSet) {
      if (category === EntityCategory.UniversalProfile) {
        newEntities.set(addr, new UniversalProfile({ id: addr, address: addr }));
      } else if (category === EntityCategory.DigitalAsset) {
        newEntities.set(addr, new DigitalAsset({ id: addr, address: addr }));
      }
    }

    return Promise.resolve({ new: newSet, valid, invalid, newEntities });
  });
}

const mockWorkerPool: IMetadataWorkerPool = {
  fetchBatch: vi.fn(),
  shutdown: vi.fn(),
};

// ---------------------------------------------------------------------------
// Step 1: EXTRACT
// ---------------------------------------------------------------------------

describe('Pipeline Step 1: EXTRACT', () => {
  it('should route logs to correct plugins by topic0', async () => {
    const topic1 = '0xtopic1';
    const topic2 = '0xtopic2';

    const extractMock1 = vi.fn();
    const populateMock1 = vi.fn();
    const persistMock1 = vi.fn();
    const extractMock2 = vi.fn();
    const populateMock2 = vi.fn();
    const persistMock2 = vi.fn();

    const plugin1: EventPlugin = {
      name: 'plugin1',
      topic0: topic1,
      requiresVerification: [],
      extract: extractMock1,
      populate: populateMock1,
      persist: persistMock1,
    };

    const plugin2: EventPlugin = {
      name: 'plugin2',
      topic0: topic2,
      requiresVerification: [],
      extract: extractMock2,
      populate: populateMock2,
      persist: persistMock2,
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin1);
    registry.registerEventPlugin(plugin2);

    const store = createMockStore();
    const context = createMockContext(store, [
      { ...mockBlock, logs: [mockLog(topic1), mockLog(topic2), mockLog(topic1)] },
    ]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    expect(extractMock1).toHaveBeenCalledTimes(2);
    expect(extractMock2).toHaveBeenCalledTimes(1);

    // Verify the new pipeline does NOT call old populate/persist methods
    expect(populateMock1).not.toHaveBeenCalled();
    expect(persistMock1).not.toHaveBeenCalled();
    expect(populateMock2).not.toHaveBeenCalled();
    expect(persistMock2).not.toHaveBeenCalled();
  });

  it('should respect contractFilter when routing', async () => {
    const topic = '0xtopic';
    const targetAddress = '0xtarget';

    const extractMock = vi.fn();
    const plugin: EventPlugin = {
      name: 'scoped-plugin',
      topic0: topic,
      contractFilter: { address: targetAddress, fromBlock: 0 },
      requiresVerification: [],
      extract: extractMock,
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [
      {
        ...mockBlock,
        logs: [mockLog(topic, targetAddress), mockLog(topic, '0xother')],
      },
    ]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    expect(extractMock).toHaveBeenCalledTimes(1);
  });

  it('should add entities to BatchContext during extract', async () => {
    const topic = '0xtopic';

    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: topic,
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('TestEntity', 'entity-1', { id: 'entity-1', data: 'test' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog(topic)] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    // Verify entity was persisted in step 2
    const mockStore = store;
    expect(mockStore.insertedEntities.length).toBeGreaterThan(0);
    expect(mockStore.insertedEntities).toContainEqual({ id: 'entity-1', data: 'test' });
  });
});

// ---------------------------------------------------------------------------
// Step 2: PERSIST RAW
// ---------------------------------------------------------------------------

describe('Pipeline Step 2: PERSIST RAW', () => {
  it('should persist all raw event entities via store.insert()', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event1', 'e1', { id: 'e1', type: 'event1' });
        ctx.addEntity('Event2', 'e2', { id: 'e2', type: 'event2' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    const mockStore = store;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockStore.insert).toHaveBeenCalled();
    expect(mockStore.insertedEntities).toContainEqual({ id: 'e1', type: 'event1' });
    expect(mockStore.insertedEntities).toContainEqual({ id: 'e2', type: 'event2' });
  });

  it('should persist entities with null FK references initially, then enrich', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          address: '0xda',
          digitalAsset: null,
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(['0xda']), new Set(['0xda'])),
      workerPool: mockWorkerPool,
    });

    // Step 2: Entity should be inserted (called once)
    const mockStore = store;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockStore.insert).toHaveBeenCalledTimes(1);
    const insertedTransfer = mockStore.insertedEntities.find((e) => e.id === 't1');
    expect(insertedTransfer).toBeDefined();

    // Step 6: Entity should be enriched and upserted
    const enrichedTransfer = mockStore.upsertedEntities.find(
      (e) => e.id === 't1' && e.digitalAsset !== undefined && e.digitalAsset !== null,
    );
    expect(enrichedTransfer).toBeDefined();
    expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda' });
  });
});

// ---------------------------------------------------------------------------
// Step 3: HANDLE
// ---------------------------------------------------------------------------

describe('Pipeline Step 3: HANDLE', () => {
  it('should call handlers for each matching bag key', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event1', 'e1', { id: 'e1' });
        ctx.addEntity('Event2', 'e2', { id: 'e2' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const handleMock = vi.fn();
    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['Event1', 'Event2'],
      handle: handleMock,
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    expect(handleMock).toHaveBeenCalledTimes(2);
    expect(handleMock).toHaveBeenCalledWith(expect.anything(), 'Event1');
    expect(handleMock).toHaveBeenCalledWith(expect.anything(), 'Event2');
  });

  it('should not call handlers when bag is empty', async () => {
    const handleMock = vi.fn();
    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['NonExistentBag'],
      handle: handleMock,
    };

    const registry = new PluginRegistry();
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    expect(handleMock).not.toHaveBeenCalled();
  });

  it('should allow handlers to add derived entities to BatchContext', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event', 'e1', { id: 'e1', value: 10 });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['Event'],
      handle: (hctx, triggeredBy) => {
        const events = hctx.batchCtx.getEntities<{ id: string; value: number }>(triggeredBy);
        for (const event of events.values()) {
          hctx.batchCtx.addEntity('Derived', `derived-${event.id}`, {
            id: `derived-${event.id}`,
            originalValue: event.value,
          });
        }
        return Promise.resolve();
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    // Derived entity should be persisted in step 4 via upsert
    const mockStore = store;
    expect(mockStore.upsertedEntities.length).toBeGreaterThan(0);
    expect(mockStore.upsertedEntities).toContainEqual({ id: 'derived-e1', originalValue: 10 });
  });

  it('should throw if handler tries to add entity to raw entity type key', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('RawEvent', 'e1', { id: 'e1' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const handler: EntityHandler = {
      name: 'bad-handler',
      listensToBag: ['RawEvent'],
      handle: (hctx) => {
        // Handler incorrectly tries to add to the same type key
        hctx.batchCtx.addEntity('RawEvent', 'e2', { id: 'e2' });
        return Promise.resolve();
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await expect(
      processBatch(context, {
        registry,
        verifyAddresses: createMockVerifyFn(),
        workerPool: mockWorkerPool,
      }),
    ).rejects.toThrow(/Handler attempted to add entity to raw type 'RawEvent'/);
  });
});

// ---------------------------------------------------------------------------
// Step 4: PERSIST DERIVED
// ---------------------------------------------------------------------------

describe('Pipeline Step 4: PERSIST DERIVED', () => {
  it('should persist handler-derived entities via store.upsert()', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('RawEvent', 'e1', { id: 'e1' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['RawEvent'],
      handle: (hctx) => {
        hctx.batchCtx.addEntity('Derived', 'd1', { id: 'd1', computed: true });
        return Promise.resolve();
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    // Raw event should be inserted
    const mockStore = store;
    expect(mockStore.insertedEntities).toContainEqual({ id: 'e1' });

    // Derived entity should be upserted
    expect(mockStore.upsertedEntities).toContainEqual({ id: 'd1', computed: true });
  });

  it('should skip entity types already persisted in step 2', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event', 'e1', { id: 'e1' });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    // 'Event' should only be in insertCalls (step 2), not upsertCalls (step 4)
    const mockStore = store;
    expect(mockStore.insertedEntities).toContainEqual({ id: 'e1' });

    // Step 4 upserts should be empty (or only core entities from step 5)
    expect(mockStore.upsertedEntities.filter((e) => e.id === 'e1')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Step 5: VERIFY
// ---------------------------------------------------------------------------

describe('Pipeline Step 5: VERIFY', () => {
  it('should collect addresses from enrichment queue', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event', 'e1', { id: 'e1', address: '0xda1' });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'Event',
          entityId: 'e1',
          fkField: 'digitalAsset',
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda2',
          entityType: 'Event',
          entityId: 'e1',
          fkField: 'anotherDA',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const verifyFn = createMockVerifyFn(new Set(['0xda1', '0xda2']), new Set(['0xda1']));

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: verifyFn,
      workerPool: mockWorkerPool,
    });

    expect(verifyFn).toHaveBeenCalledWith(
      EntityCategory.DigitalAsset,
      new Set(['0xda1', '0xda2']),
      store,
      context,
    );
  });

  it('should persist core entities for newly verified addresses', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.UniversalProfile],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Event', 'e1', { id: 'e1' });
        ctx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'Event',
          entityId: 'e1',
          fkField: 'profile',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(['0xup1']), new Set(['0xup1'])),
      workerPool: mockWorkerPool,
    });

    // Core entities should be upserted in step 5
    const mockStore = store;
    const upEntity = mockStore.upsertedEntities.find(
      (e) => e.id === '0xup1' && e.address === '0xup1',
    );
    expect(upEntity).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Step 6: ENRICH
// ---------------------------------------------------------------------------

describe('Pipeline Step 6: ENRICH', () => {
  it('should set FK fields for valid addresses', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          address: '0xda1',
          digitalAsset: null,
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(['0xda1']), new Set(['0xda1'])),
      workerPool: mockWorkerPool,
    });

    // Find the enriched entity in upsertCalls (should be called twice: step 5 for core, step 6 for enrichment)
    const mockStore = store;
    const enrichedTransfer = mockStore.upsertedEntities.find((e) => {
      const digitalAsset = e.digitalAsset;
      if (typeof digitalAsset !== 'object' || digitalAsset === null) return false;
      return e.id === 't1' && 'id' in digitalAsset && digitalAsset.id === '0xda1';
    });
    expect(enrichedTransfer).toBeDefined();
    expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda1' });
  });

  it('should leave FK null for invalid addresses', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          address: '0xinvalid',
          digitalAsset: null,
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xinvalid',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(), new Set()),
      workerPool: mockWorkerPool,
    });

    // Entity should be inserted in step 2, but NOT enriched in step 6
    const mockStore = store;
    expect(mockStore.insertedEntities).toContainEqual({
      id: 't1',
      address: '0xinvalid',
      digitalAsset: null,
    });

    // Should not appear in step 6 upserts (only step 5 might have core entities)
    const enrichmentUpserts = mockStore.upsertedEntities.filter((e) => e.id === 't1');
    expect(enrichmentUpserts).toHaveLength(0);
  });

  it('should handle multiple FK fields on same entity', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          from: '0xup1',
          to: '0xup2',
          address: '0xda1',
          fromProfile: null,
          toProfile: null,
          digitalAsset: null,
        });
        ctx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'fromProfile',
        });
        ctx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: '0xup2',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'toProfile',
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(
        new Set(['0xup1', '0xup2', '0xda1']),
        new Set(['0xup1', '0xup2', '0xda1']),
      ),
      workerPool: mockWorkerPool,
    });

    // Find enriched entity
    const mockStore = store;
    const enrichedTransfer = mockStore.upsertedEntities.find(
      (e) => e.id === 't1' && e.fromProfile !== undefined && e.fromProfile !== null,
    );
    expect(enrichedTransfer).toBeDefined();
    expect(enrichedTransfer?.fromProfile).toMatchObject({ id: '0xup1' });
    expect(enrichedTransfer?.toProfile).toMatchObject({ id: '0xup2' });
    expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda1' });
  });

  it('should skip enrichment and warn when FK field does not exist on entity', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        // Entity created WITHOUT the FK field in constructor props
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          address: '0xda1',
          // NOTE: 'digitalAsset' field intentionally omitted
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset', // This field doesn't exist on the entity instance
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(['0xda1']), new Set(['0xda1'])),
      workerPool: mockWorkerPool,
    });

    // Entity should be inserted in Step 2 (raw persistence)
    const mockStore = store;
    expect(mockStore.insertedEntities.find((e) => e.id === 't1')).toBeDefined();

    // Entity should NOT be upserted in Step 6 (enrichment) because FK field doesn't exist
    const enrichedTransfer = mockStore.upsertedEntities.find((e) => e.id === 't1');
    expect(enrichedTransfer).toBeUndefined();

    // Warning should be logged
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(context.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Skipping enrichment: FK field not found on entity'),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(context.log.warn).toHaveBeenCalledWith(expect.stringContaining('digitalAsset'));
  });
});

// ---------------------------------------------------------------------------
// Integration test: Full pipeline flow
// ---------------------------------------------------------------------------

describe('Pipeline Integration', () => {
  it('should execute all 6 steps correctly for a complete flow', async () => {
    const plugin: EventPlugin = {
      name: 'transfer-plugin',
      topic0: '0xtransfer',
      requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],
      extract: (log: Log, block: Block, ctx: IBatchContext) => {
        ctx.addEntity('Transfer', 't1', {
          id: 't1',
          from: '0xup1',
          to: '0xup2',
          address: '0xda1',
          amount: 100,
          fromProfile: null,
          toProfile: null,
          digitalAsset: null,
        });
        ctx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'fromProfile',
        });
        ctx.queueEnrichment({
          category: EntityCategory.UniversalProfile,
          address: '0xup2',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'toProfile',
        });
        ctx.queueEnrichment({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
        });
      },
      populate: vi.fn(),
      persist: vi.fn(),
    };

    const handler: EntityHandler = {
      name: 'balance-handler',
      listensToBag: ['Transfer'],
      handle: (hctx) => {
        const transfers = hctx.batchCtx.getEntities<{ from: string; to: string; amount: number }>(
          'Transfer',
        );
        for (const transfer of transfers.values()) {
          hctx.batchCtx.addEntity('Balance', `balance-${transfer.to}`, {
            id: `balance-${transfer.to}`,
            owner: transfer.to,
            amount: transfer.amount,
          });
        }
        return Promise.resolve();
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtransfer')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(
        new Set(['0xup1', '0xup2', '0xda1']),
        new Set(['0xup1', '0xup2', '0xda1']),
      ),
      workerPool: mockWorkerPool,
    });

    // Step 2: Raw Transfer should be inserted
    const mockStore = store;
    expect(mockStore.insertedEntities.find((e) => e.id === 't1')).toBeDefined();

    // Step 4: Derived Balance should be upserted
    expect(mockStore.upsertedEntities.find((e) => e.id === 'balance-0xup2')).toBeDefined();

    // Step 5: Core entities should be created
    expect(
      mockStore.upsertedEntities.find((e) => e.id === '0xup1' && e.address === '0xup1'),
    ).toBeDefined();
    expect(
      mockStore.upsertedEntities.find((e) => e.id === '0xup2' && e.address === '0xup2'),
    ).toBeDefined();
    expect(
      mockStore.upsertedEntities.find((e) => e.id === '0xda1' && e.address === '0xda1'),
    ).toBeDefined();

    // Step 6: Transfer should be enriched with FKs
    const enrichedTransfer = mockStore.upsertedEntities.find(
      (e) => e.id === 't1' && e.fromProfile !== undefined && e.fromProfile !== null,
    );
    expect(enrichedTransfer).toBeDefined();
    expect(enrichedTransfer?.fromProfile).toMatchObject({ id: '0xup1' });
    expect(enrichedTransfer?.toProfile).toMatchObject({ id: '0xup2' });
    expect(enrichedTransfer?.digitalAsset).toMatchObject({ id: '0xda1' });
  });
});
