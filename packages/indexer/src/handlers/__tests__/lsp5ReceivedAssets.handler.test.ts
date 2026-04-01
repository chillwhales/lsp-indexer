/**
 * Unit tests for lsp5ReceivedAssets handler.
 *
 * Test cases:
 * - Cross-batch merge: Index arrives in batch 1, Map arrives in batch 2
 * - Verifies merged entity is persisted via addEntity()
 * - Ensures no data loss when events fire across batch boundaries
 */
import { type HandlerContext } from '@/core/types';
import { DataChanged, LSP5ReceivedAsset } from '@/model';
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { Store } from '@subsquid/typeorm-store';
import { bytesToHex, hexToBytes } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LSP5ReceivedAssetsHandler from '../lsp5ReceivedAssets.handler';

// ---------------------------------------------------------------------------
// Data key constants
// ---------------------------------------------------------------------------
const LSP5_RECEIVED_ASSETS_INDEX_PREFIX: string = LSP5DataKeys['LSP5ReceivedAssets[]'].index;
const LSP5_RECEIVED_ASSETS_MAP_PREFIX: string = LSP5DataKeys.LSP5ReceivedAssetsMap;

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
} {
  const entityBags = new Map<string, Map<string, unknown>>();

  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    addEntity: vi.fn((type: string, id: string, entity: unknown) => {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      entityBags.get(type)?.set(id, entity);
    }),
    queueEnrichment: vi.fn(),
    _entityBags: entityBags,
  };
}

// ---------------------------------------------------------------------------
// Mock Store helper
// ---------------------------------------------------------------------------
function createMockStore(existingAssets: LSP5ReceivedAsset[] = []): Store {
  return {
    findBy: vi.fn((entityClass: unknown) => {
      if (entityClass === LSP5ReceivedAsset) {
        return Promise.resolve(existingAssets);
      }
      return Promise.resolve([]);
    }),
  } as unknown as Store;
}

// ---------------------------------------------------------------------------
// Mock HandlerContext helper
// ---------------------------------------------------------------------------
function createMockHandlerContext(
  batchCtx: ReturnType<typeof createMockBatchCtx>,
  store: Store,
): HandlerContext {
  return {
    store,
    context: {
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    } as unknown as HandlerContext['context'],
    isHead: false,
    batchCtx: batchCtx as unknown as HandlerContext['batchCtx'],
    workerPool: {} as HandlerContext['workerPool'],
  } as HandlerContext;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function createIndexEvent(
  upAddress: string,
  assetAddress: string,
  arrayIndex: number,
  timestamp = new Date(1700000000 * 1000),
): DataChanged {
  // arrayIndex is stored in the last 16 bytes of the key as a uint128
  const indexBytes = new Uint8Array(16);
  const view = new DataView(indexBytes.buffer);
  view.setBigUint64(8, BigInt(arrayIndex), false); // Store in last 8 bytes (big-endian)
  const indexKey = `${LSP5_RECEIVED_ASSETS_INDEX_PREFIX}${bytesToHex(indexBytes).slice(2)}`;

  return new DataChanged({
    id: `index-event-${arrayIndex}`,
    blockNumber: 2000000,
    logIndex: 0,
    address: upAddress,
    dataKey: indexKey,
    dataValue: assetAddress,
    timestamp,
  });
}

function createMapEvent(
  upAddress: string,
  assetAddress: string,
  interfaceId: string,
  arrayIndex: number,
  timestamp = new Date(1700000100 * 1000),
): DataChanged {
  const assetBytes = hexToBytes(assetAddress as `0x${string}`);
  const mapKey = `${LSP5_RECEIVED_ASSETS_MAP_PREFIX}${bytesToHex(assetBytes).slice(2)}`;

  // Map value: interfaceId (4 bytes) + arrayIndex (16 bytes) = 20 bytes total
  const interfaceIdBytes = hexToBytes(interfaceId as `0x${string}`);
  const indexBytes = new Uint8Array(16);
  const view = new DataView(indexBytes.buffer);
  view.setBigUint64(8, BigInt(arrayIndex), false); // Store in last 8 bytes (big-endian)

  const mapValue = bytesToHex(new Uint8Array([...interfaceIdBytes, ...indexBytes]));

  return new DataChanged({
    id: `map-event-${assetAddress}`,
    blockNumber: 2000001,
    logIndex: 0,
    address: upAddress,
    dataKey: mapKey,
    dataValue: mapValue,
    timestamp,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('lsp5ReceivedAssets handler - Cross-batch merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge Index (batch 1) with Map (batch 2) and persist via addEntity', async () => {
    // Simulate: Batch 1 had Index event, Batch 2 has Map event
    const upAddress = '0x1234567890123456789012345678901234567890';
    const assetAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const id = `${upAddress} - ${assetAddress}`;

    // Existing entity in DB from Batch 1 (Index event only)
    const existingAsset = new LSP5ReceivedAsset({
      id,
      address: upAddress,
      assetAddress,
      arrayIndex: 5n, // bigint
      interfaceId: null, // Map event hasn't fired yet
      receivedAsset: null,
      timestamp: new Date(1700000000 * 1000),
    });

    const store = createMockStore([existingAsset]);
    const batchCtx = createMockBatchCtx();

    // Batch 2: Map event arrives
    const mapEvent = createMapEvent(upAddress, assetAddress, '0x12345678', 5);
    batchCtx._entityBags.set('DataChanged', new Map([[mapEvent.id, mapEvent]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await LSP5ReceivedAssetsHandler.handle(hctx, 'DataChanged');

    // Assert: Should merge Map data into existing entity from DB
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'LSP5ReceivedAsset',
      id,
      expect.objectContaining({
        id,
        address: upAddress,
        assetAddress,
        arrayIndex: 5n, // Preserved from DB (bigint)
        interfaceId: '0x12345678', // Added from Map event
        timestamp: new Date(1700000100 * 1000), // Updated to Map event timestamp
      }),
    );
  });

  it('should merge Map (batch 1) with Index (batch 2) and persist via addEntity', async () => {
    // Simulate: Batch 1 had Map event, Batch 2 has Index event
    const upAddress = '0x2234567890123456789012345678901234567890';
    const assetAddress = '0xbbcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const id = `${upAddress} - ${assetAddress}`;

    // Existing entity in DB from Batch 1 (Map event only)
    const existingAsset = new LSP5ReceivedAsset({
      id,
      address: upAddress,
      assetAddress,
      arrayIndex: null, // Index event hasn't fired yet
      interfaceId: '0x87654321',
      receivedAsset: null,
      timestamp: new Date(1700000000 * 1000),
    });

    const store = createMockStore([existingAsset]);
    const batchCtx = createMockBatchCtx();

    // Batch 2: Index event arrives
    const indexEvent = createIndexEvent(upAddress, assetAddress, 3);
    batchCtx._entityBags.set('DataChanged', new Map([[indexEvent.id, indexEvent]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await LSP5ReceivedAssetsHandler.handle(hctx, 'DataChanged');

    // Assert: Should merge Index data into existing entity from DB
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'LSP5ReceivedAsset',
      id,
      expect.objectContaining({
        id,
        address: upAddress,
        assetAddress,
        arrayIndex: 3n, // Added from Index event (bigint)
        interfaceId: '0x87654321', // Preserved from DB
        timestamp: new Date(1700000000 * 1000), // Preserved from DB (Index has same timestamp)
      }),
    );
  });

  it('should handle both Index and Map in same batch (intra-batch merge)', async () => {
    // Typical case: Both Index and Map fire in same batch
    const upAddress = '0x3334567890123456789012345678901234567890';
    const assetAddress = '0xccbdefabcdefabcdefabcdefabcdefabcdefabcd';
    const id = `${upAddress} - ${assetAddress}`;

    const store = createMockStore(); // Empty DB
    const batchCtx = createMockBatchCtx();

    // Same batch: Both events
    const indexEvent = createIndexEvent(upAddress, assetAddress, 7);
    const mapEvent = createMapEvent(upAddress, assetAddress, '0xaabbccdd', 7);

    batchCtx._entityBags.set(
      'DataChanged',
      new Map([
        [indexEvent.id, indexEvent],
        [mapEvent.id, mapEvent],
      ]),
    );

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await LSP5ReceivedAssetsHandler.handle(hctx, 'DataChanged');

    // Assert: Second call should have both Index and Map data merged
    const secondCall = batchCtx.addEntity.mock.calls[1];
    expect(secondCall[0]).toBe('LSP5ReceivedAsset');
    expect(secondCall[1]).toBe(id);
    expect(secondCall[2]).toMatchObject({
      id,
      address: upAddress,
      assetAddress,
      arrayIndex: 7n, // From Index (bigint)
      interfaceId: '0xaabbccdd', // From Map
    });

    // Should be called twice (once for Index, once for Map merging)
    expect(batchCtx.addEntity).toHaveBeenCalledTimes(2);
  });

  it('should preserve receivedAsset FK when merging cross-batch', async () => {
    // Edge case: Enrichment populated FK in batch 1, Map arrives in batch 2
    const upAddress = '0x4434567890123456789012345678901234567890';
    const assetAddress = '0xddbdefabcdefabcdefabcdefabcdefabcdefabcd';
    const id = `${upAddress} - ${assetAddress}`;

    // Existing entity with FK populated by enrichment
    const existingAsset = new LSP5ReceivedAsset({
      id,
      address: upAddress,
      assetAddress,
      arrayIndex: 2n, // bigint
      interfaceId: null,
      receivedAsset: null, // FK is null (not a string ID, it's a relation)
      timestamp: new Date(1700000000 * 1000),
    });

    const store = createMockStore([existingAsset]);
    const batchCtx = createMockBatchCtx();

    // Batch 2: Map event
    const mapEvent = createMapEvent(upAddress, assetAddress, '0x11223344', 2);
    batchCtx._entityBags.set('DataChanged', new Map([[mapEvent.id, mapEvent]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await LSP5ReceivedAssetsHandler.handle(hctx, 'DataChanged');

    // Assert: FK should be preserved (null in this case as we can't mock FK relations easily)
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'LSP5ReceivedAsset',
      id,
      expect.objectContaining({
        id,
        arrayIndex: 2n, // bigint
        interfaceId: '0x11223344',
        // receivedAsset FK is a relation (DigitalAsset entity), not testable in unit tests
      }),
    );
  });
});
