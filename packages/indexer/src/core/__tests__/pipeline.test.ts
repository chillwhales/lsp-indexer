import {
  DataChanged,
  DigitalAsset,
  Follow,
  Follower,
  TotalSupply,
  Transfer,
  UniversalProfile,
} from '@/model';
import { Store } from '@subsquid/typeorm-store';
import { describe, expect, it, vi } from 'vitest';
import { processBatch, VerifyFn } from '../pipeline';
import { PluginRegistry } from '../registry';
import {
  Block,
  Context,
  Entity,
  EntityCategory,
  EntityHandler,
  EventPlugin,
  IBatchContext,
  IMetadataWorkerPool,
  Log,
  VerificationResult,
} from '../types';

/** Default block fields for test entities. */
const B = { blockNumber: 0, transactionIndex: 0, logIndex: 0 } as const;
const ADDR = '0x0000000000000000000000000000000000000001';
const TS = new Date(0);

// ---------------------------------------------------------------------------
// Entity factory helpers
// ---------------------------------------------------------------------------

/** Create a DataChanged entity for testing. */
function mkDataChanged(id: string, props?: Partial<DataChanged>): DataChanged {
  return new DataChanged({
    id,
    ...B,
    address: ADDR,
    dataKey: '0x',
    dataValue: '0x',
    timestamp: TS,
    ...props,
  });
}

/** Create a Follow entity for testing. */
function mkFollow(id: string): Follow {
  return new Follow({
    id,
    ...B,
    address: ADDR,
    followerAddress: ADDR,
    followedAddress: '0x0000000000000000000000000000000000000002',
    timestamp: TS,
  });
}

/** Create a Transfer entity for testing (used as LSP7Transfer). */
function mkTransfer(id: string, props?: Partial<Transfer>): Transfer {
  return new Transfer({
    id,
    ...B,
    address: ADDR,
    operator: ADDR,
    from: ADDR,
    to: '0x0000000000000000000000000000000000000002',
    amount: 0n,
    force: false,
    data: '0x',
    timestamp: TS,
    digitalAsset: null,
    fromProfile: null,
    toProfile: null,
    ...props,
  });
}

/** Create a Follower entity for testing (handler-derived). */
function mkFollower(id: string): Follower {
  return new Follower({
    id,
    ...B,
    followerAddress: ADDR,
    followedAddress: '0x0000000000000000000000000000000000000002',
    timestamp: TS,
  });
}

/** Create a TotalSupply entity for testing (handler-derived). */
function mkTotalSupply(id: string, props?: Partial<TotalSupply>): TotalSupply {
  return new TotalSupply({
    id,
    ...B,
    address: ADDR,
    value: 0n,
    timestamp: TS,
    ...props,
  });
}

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
    findBy: vi.fn(() => Promise.resolve([])),
    find: vi.fn(() => Promise.resolve([])),
    remove: vi.fn(() => Promise.resolve()),
  };

  return Object.assign(baseStore, {
    insertedEntities,
    upsertedEntities,
  }) as MockStore;
}

function createMockContext(store: Store, blocks: Block[] = [mockBlock]): Context {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  // Make child() return a new logger with the same methods
  mockLogger.child = vi.fn(() => ({ ...mockLogger }));

  return {
    blocks,
    store,
    log: mockLogger,
    isHead: false,
  } as unknown as Context;
}

type MockVerifyFn = ReturnType<typeof vi.fn<VerifyFn>>;

function createMockVerifyFn(
  validAddresses: Set<string> = new Set(),
  newAddresses: Set<string> = new Set(),
): MockVerifyFn {
  return vi.fn((category: EntityCategory, addresses: Set<string>): Promise<VerificationResult> => {
    const valid = new Set([...addresses].filter((addr) => validAddresses.has(addr)));
    const newSet = new Set([...addresses].filter((addr) => newAddresses.has(addr)));
    const invalid = new Set([...addresses].filter((addr) => !validAddresses.has(addr)));

    const newEntities = new Map<string, UniversalProfile | DigitalAsset>();
    for (const addr of newSet) {
      if (category === EntityCategory.UniversalProfile) {
        newEntities.set(
          addr,
          new UniversalProfile({
            id: addr,
            address: addr,
            blockNumber: 0,
            transactionIndex: 0,
            logIndex: 0,
            timestamp: new Date('2024-01-01T00:00:00Z'),
          }),
        );
      } else if (category === EntityCategory.DigitalAsset) {
        newEntities.set(
          addr,
          new DigitalAsset({
            id: addr,
            address: addr,
            blockNumber: 0,
            transactionIndex: 0,
            logIndex: 0,
            timestamp: new Date('2024-01-01T00:00:00Z'),
          }),
        );
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
    const extractMock2 = vi.fn();

    const plugin1: EventPlugin = {
      name: 'plugin1',
      topic0: topic1,
      requiresVerification: [],
      extract: extractMock1,
    };

    const plugin2: EventPlugin = {
      name: 'plugin2',
      topic0: topic2,
      requiresVerification: [],
      extract: extractMock2,
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
  });

  it('should respect contractFilter when routing', async () => {
    const topic = '0xtopic';
    const targetAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const otherAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

    const extractMock = vi.fn();
    const plugin: EventPlugin = {
      name: 'scoped-plugin',
      topic0: topic,
      contractFilter: { address: targetAddress, fromBlock: 0 },
      requiresVerification: [],
      extract: extractMock,
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [
      {
        ...mockBlock,
        logs: [mockLog(topic, targetAddress), mockLog(topic, otherAddress)],
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'entity-1', mkDataChanged('entity-1'));
      },
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
    expect(mockStore.insertedEntities.find((e) => e.id === 'entity-1')).toBeDefined();
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'e1', mkDataChanged('e1'));
        ctx.addEntity('Follow', 'e2', mkFollow('e2'));
      },
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
    expect(mockStore.insert).toHaveBeenCalled();
    expect(mockStore.insertedEntities.find((e) => e.id === 'e1')).toBeDefined();
    expect(mockStore.insertedEntities.find((e) => e.id === 'e2')).toBeDefined();
  });

  it('should persist entities with null FK references initially, then enrich', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.DigitalAsset],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity(
          'LSP7Transfer',
          't1',
          mkTransfer('t1', { address: '0xda', digitalAsset: null }),
        );
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'e1', mkDataChanged('e1'));
        ctx.addEntity('Follow', 'e2', mkFollow('e2'));
      },
    };

    const handleMock = vi.fn();
    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['DataChanged', 'Follow'],
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
    expect(handleMock).toHaveBeenCalledWith(expect.anything(), 'DataChanged');
    expect(handleMock).toHaveBeenCalledWith(expect.anything(), 'Follow');
  });

  it('should not call handlers when bag is empty', async () => {
    const handleMock = vi.fn();
    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['OrbsClaimed'],
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'e1', mkDataChanged('e1'));
      },
    };

    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['DataChanged'],
      handle: (hctx, triggeredBy) => {
        const events = hctx.batchCtx.getEntities(triggeredBy);
        for (const event of events.values()) {
          hctx.batchCtx.addEntity(
            'Follower',
            `derived-${event.id}`,
            mkFollower(`derived-${event.id}`),
          );
        }
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
    expect(mockStore.upsertedEntities.find((e) => e.id === 'derived-e1')).toBeDefined();
  });

  it('should throw if handler tries to add entity to raw entity type key', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'e1', mkDataChanged('e1'));
      },
    };

    const handler: EntityHandler = {
      name: 'bad-handler',
      listensToBag: ['DataChanged'],
      handle: (hctx) => {
        // Handler incorrectly tries to add to the same type key
        hctx.batchCtx.addEntity('DataChanged', 'e2', mkDataChanged('e2'));
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
    ).rejects.toThrow(/Handler attempted to add entity to raw type 'DataChanged'/);
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'e1', mkDataChanged('e1'));
      },
    };

    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['DataChanged'],
      handle: (hctx) => {
        hctx.batchCtx.addEntity('Follower', 'd1', mkFollower('d1'));
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
    expect(mockStore.insertedEntities.find((e) => e.id === 'e1')).toBeDefined();

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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('LSP7Transfer', 'e1', mkTransfer('e1', { address: '0xda1' }));
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'LSP7Transfer',
          entityId: 'e1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda2',
          entityType: 'LSP7Transfer',
          entityId: 'e1',
          fkField: 'nft',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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
      expect.any(Map),
    );
  });

  it('should persist core entities for newly verified addresses', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.UniversalProfile],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('LSP7Transfer', 'e1', mkTransfer('e1'));
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'LSP7Transfer',
          entityId: 'e1',
          fkField: 'fromProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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

  it('should call store.upsert separately per category to avoid mixed entity classes', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('LSP7Transfer', 'e1', mkTransfer('e1'));
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'LSP7Transfer',
          entityId: 'e1',
          fkField: 'fromProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'LSP7Transfer',
          entityId: 'e1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog('0xtopic')] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(new Set(['0xup1', '0xda1']), new Set(['0xup1', '0xda1'])),
      workerPool: mockWorkerPool,
    });

    // store.upsert should be called at least once per category
    // Verify that each upsert call contains entities of only one class
    const upsertMock = store.upsert as ReturnType<typeof vi.fn>;

    // Find calls that contain ONLY core entities (UniversalProfile or DigitalAsset)
    // These are the Step 5 verification upserts we want to test
    const coreEntityCalls = upsertMock.mock.calls.filter((call) => {
      const entities = call[0] as Entity[];
      return entities.some((e) => e instanceof UniversalProfile || e instanceof DigitalAsset);
    });

    // Ensure at least one call was made for core entities
    expect(coreEntityCalls.length).toBeGreaterThan(0);

    // Critical test: Ensure no call mixes UniversalProfile and DigitalAsset entities
    // This is the regression test for the TypeORM "mass saving allowed only for entities
    // of the same class" error
    for (const call of coreEntityCalls) {
      const entities = call[0] as Entity[];
      if (entities.length === 0) continue;

      const hasUP = entities.some((e) => e instanceof UniversalProfile);
      const hasDA = entities.some((e) => e instanceof DigitalAsset);

      // Should never have both in the same call
      if (hasUP && hasDA) {
        throw new Error(
          `REGRESSION: Mixed entity classes in single upsert call! ` +
            `This causes TypeORM "mass saving allowed only for entities of the same class" error. ` +
            `Found: ${entities.map((e) => e.constructor.name).join(', ')}`,
        );
      }
    }

    // Verify that both categories were processed separately
    const upEntities = coreEntityCalls.flatMap((call) =>
      (call[0] as Entity[]).filter((e) => e instanceof UniversalProfile),
    );
    const daEntities = coreEntityCalls.flatMap((call) =>
      (call[0] as Entity[]).filter((e) => e instanceof DigitalAsset),
    );

    expect(upEntities.length).toBeGreaterThan(0);
    expect(daEntities.length).toBeGreaterThan(0);

    // Verify entities were actually created
    const mockStore = store;
    expect(mockStore.upsertedEntities.find((e) => e.id === '0xup1')).toBeDefined();
    expect(mockStore.upsertedEntities.find((e) => e.id === '0xda1')).toBeDefined();
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity(
          'LSP7Transfer',
          't1',
          mkTransfer('t1', { address: '0xda1', digitalAsset: null }),
        );
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity(
          'LSP7Transfer',
          't1',
          mkTransfer('t1', { address: '0xinvalid', digitalAsset: null }),
        );
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xinvalid',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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
    const insertedTransfer = mockStore.insertedEntities.find((e) => e.id === 't1');
    expect(insertedTransfer).toBeDefined();
    expect((insertedTransfer as unknown as Transfer | undefined)?.digitalAsset).toBeNull();

    // Should not appear in step 6 upserts (only step 5 might have core entities)
    const enrichmentUpserts = mockStore.upsertedEntities.filter((e) => e.id === 't1');
    expect(enrichmentUpserts).toHaveLength(0);
  });

  it('should handle multiple FK fields on same entity', async () => {
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: '0xtopic',
      requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity(
          'LSP7Transfer',
          't1',
          mkTransfer('t1', {
            from: '0xup1',
            to: '0xup2',
            address: '0xda1',
            fromProfile: null,
            toProfile: null,
            digitalAsset: null,
          }),
        );
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'fromProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup2',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'toProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        // Use DataChanged which does NOT have a 'digitalAsset' FK field
        ctx.addEntity('DataChanged', 't1', mkDataChanged('t1', { address: '0xda1' }));
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'DataChanged',
          entityId: 't1',
          fkField: 'digitalAsset', // This field doesn't exist on DataChanged
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
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

    // Warning should be logged (with attributes object as first param, message as second)
    expect(context.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 't1',
        entityType: 'DataChanged',
        fkField: 'digitalAsset',
      }),
      'Skipping enrichment: FK field not found on entity',
    );
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
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity(
          'LSP7Transfer',
          't1',
          mkTransfer('t1', {
            from: '0xup1',
            to: '0xup2',
            address: '0xda1',
            amount: 100n,
            fromProfile: null,
            toProfile: null,
            digitalAsset: null,
          }),
        );
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup1',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'fromProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.UniversalProfile,
          address: '0xup2',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'toProfile',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
        ctx.queueEnrichment<Transfer>({
          category: EntityCategory.DigitalAsset,
          address: '0xda1',
          entityType: 'LSP7Transfer',
          entityId: 't1',
          fkField: 'digitalAsset',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          timestamp: 1700000000000,
        });
      },
    };

    const handler: EntityHandler = {
      name: 'total-supply-handler',
      listensToBag: ['LSP7Transfer'],
      handle: (hctx, triggeredBy) => {
        const transfers = hctx.batchCtx.getEntities(triggeredBy);
        for (const transfer of transfers.values()) {
          hctx.batchCtx.addEntity(
            'TotalSupply',
            `supply-${(transfer as Transfer).to}`,
            mkTotalSupply(`supply-${(transfer as Transfer).to}`, {
              address: (transfer as Transfer).address,
              value: (transfer as Transfer).amount,
            }),
          );
        }
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

    // Step 4: Derived TotalSupply should be upserted
    expect(mockStore.upsertedEntities.find((e) => e.id === 'supply-0xup2')).toBeDefined();

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

  it('should emit BATCH_SUMMARY log with timing and entity counts', async () => {
    const topic = '0xtopic';

    // Plugin that creates a couple entities
    const plugin: EventPlugin = {
      name: 'test-plugin',
      topic0: topic,
      requiresVerification: [],
      extract: (_log: Log, _block: Block, ctx: IBatchContext) => {
        ctx.addEntity('DataChanged', 'dc1', mkDataChanged('dc1'));
        ctx.addEntity('DataChanged', 'dc2', mkDataChanged('dc2'));
        ctx.addEntity('LSP7Transfer', 't1', mkTransfer('t1'));
      },
    };

    // Handler that creates one more entity
    const handler: EntityHandler = {
      name: 'test-handler',
      listensToBag: ['DataChanged'],
      handle: (hctx, triggeredBy) => {
        const events = hctx.batchCtx.getEntities(triggeredBy);
        if (events.size > 0) {
          hctx.batchCtx.addEntity('Follow', 'f1', mkFollow('f1'));
        }
      },
    };

    const registry = new PluginRegistry();
    registry.registerEventPlugin(plugin);
    registry.registerEntityHandler(handler);

    const store = createMockStore();
    const context = createMockContext(store, [{ ...mockBlock, logs: [mockLog(topic)] }]);

    await processBatch(context, {
      registry,
      verifyAddresses: createMockVerifyFn(),
      workerPool: mockWorkerPool,
    });

    // Find the BATCH_SUMMARY log call
    const batchSummaryCall = (context.log.info as any).mock.calls.find(
      (call: any[]) => call[1] === 'Batch complete',
    );

    expect(batchSummaryCall).toBeDefined();

    const summaryData = batchSummaryCall[0];

    // Verify required fields are present
    expect(summaryData).toHaveProperty('blockCount');
    expect(summaryData).toHaveProperty('totalEntities');
    expect(summaryData).toHaveProperty('totalEnrichments');
    expect(summaryData).toHaveProperty('stepTimings');
    expect(summaryData).toHaveProperty('totalDurationMs');

    // Verify data types and reasonable values
    expect(typeof summaryData.blockCount).toBe('number');
    expect(typeof summaryData.totalEntities).toBe('number');
    expect(typeof summaryData.totalEnrichments).toBe('number');
    expect(typeof summaryData.totalDurationMs).toBe('number');
    expect(summaryData.blockCount).toBe(1);
    expect(summaryData.totalEntities).toBe(4); // 2 DataChanged + 1 Transfer + 1 Follow

    // Verify step timings structure
    const timings = summaryData.stepTimings;
    expect(timings).toHaveProperty('extract');
    expect(timings).toHaveProperty('persistRaw');
    expect(timings).toHaveProperty('handle');
    expect(timings).toHaveProperty('clearSubEntities');
    expect(timings).toHaveProperty('deleteEntities');
    expect(timings).toHaveProperty('persistDerived');
    expect(timings).toHaveProperty('verify');
    expect(timings).toHaveProperty('enrich');
    expect(timings).toHaveProperty('resolve');

    // All timing values should be non-negative numbers
    Object.values(timings).forEach((timing) => {
      expect(typeof timing).toBe('number');
      expect(timing).toBeGreaterThanOrEqual(0);
    });
  });
});
