/**
 * Unit tests for LSP29EncryptedAsset data key handler.
 *
 * Covers:
 * - Length key: exact match → LSP29EncryptedAssetsLength entity
 * - Index key: prefix match → LSP29EncryptedAsset entity with URL + arrayIndex
 * - Map key: prefix match → LSP29EncryptedAssetEntry entity with contentIdHash
 * - Revision count key: prefix match → LSP29EncryptedAssetRevisionCount entity
 * - Enrichment queueing for all 4 paths
 * - Edge cases: wrong-length values, empty data
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { LSP29DataKeys } from '@chillwhales/lsp29';
import {
  DataChanged,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetEntry,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetsLength,
} from '@chillwhales/typeorm';
import { numberToHex, padHex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import LSP29EncryptedAssetHandler from '../lsp29EncryptedAsset.handler';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  hasEntities: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  queueClear: ReturnType<typeof vi.fn>;
  queueDelete: ReturnType<typeof vi.fn>;
  setPersistHint: ReturnType<typeof vi.fn>;
  removeEntity: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
  _enrichmentQueue: unknown[];
} {
  const entityBags = new Map<string, Map<string, unknown>>();
  const enrichmentQueue: unknown[] = [];

  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    addEntity: vi.fn((type: string, id: string, entity: unknown) => {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      const bag = entityBags.get(type);
      if (bag) bag.set(id, entity);
    }),
    hasEntities: vi.fn((type: string) => {
      const bag = entityBags.get(type);
      return bag != null && bag.size > 0;
    }),
    queueEnrichment: vi.fn((request: unknown) => enrichmentQueue.push(request)),
    queueClear: vi.fn(),
    queueDelete: vi.fn(),
    setPersistHint: vi.fn(),
    removeEntity: vi.fn(),
    _entityBags: entityBags,
    _enrichmentQueue: enrichmentQueue,
  };
}

function createMockHandlerContext(batchCtx: ReturnType<typeof createMockBatchCtx>): HandlerContext {
  return {
    store: {} as HandlerContext['store'],
    context: {
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as HandlerContext['context'],
    isHead: false,
    batchCtx: batchCtx as unknown as HandlerContext['batchCtx'],
    workerPool: {} as HandlerContext['workerPool'],
  } as HandlerContext;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ADDRESS = '0x1234567890abcdef1234567890AbCdEf12345678';
const TIMESTAMP = new Date('2025-01-15T10:00:00Z');
const BLOCK_NUMBER = 500;
const TX_INDEX = 2;
const LOG_INDEX = 7;

/** Create a DataChanged event with the given data key and value. */
function makeDataChanged(dataKey: string, dataValue: string): DataChanged {
  return new DataChanged({
    id: 'dc-test-1',
    address: ADDRESS,
    timestamp: TIMESTAMP,
    blockNumber: BLOCK_NUMBER,
    transactionIndex: TX_INDEX,
    logIndex: LOG_INDEX,
    dataKey,
    dataValue,
  } as Partial<DataChanged>);
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

describe('LSP29EncryptedAssetHandler - Length key', () => {
  it('creates LSP29EncryptedAssetsLength from valid uint128', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // 16-byte uint128 = 3
    const dataValue = padHex(numberToHex(3), { size: 16 });
    const event = makeDataChanged(LSP29DataKeys['LSP29EncryptedAssets[]'].length, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const lengthCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetsLength',
    );
    expect(lengthCalls.length).toBe(1);
    const entity = lengthCalls[0][2] as LSP29EncryptedAssetsLength;
    expect(entity.id).toBe(ADDRESS);
    expect(entity.address).toBe(ADDRESS);
    expect(entity.value).toBe(3n);
    expect(entity.rawValue).toBe(dataValue);
  });

  it('stores null value for wrong-length data', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // 15 bytes — not exactly 16
    const dataValue = padHex('0x01', { size: 15 });
    const event = makeDataChanged(LSP29DataKeys['LSP29EncryptedAssets[]'].length, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const lengthCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetsLength',
    );
    expect(lengthCalls.length).toBe(1);
    const entity = lengthCalls[0][2] as LSP29EncryptedAssetsLength;
    expect(entity.value).toBeNull();
  });

  it('stores null value for empty 0x data', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const event = makeDataChanged(LSP29DataKeys['LSP29EncryptedAssets[]'].length, '0x');
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const lengthCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetsLength',
    );
    expect(lengthCalls.length).toBe(1);
    expect((lengthCalls[0][2] as LSP29EncryptedAssetsLength).value).toBeNull();
  });

  it('queues UP enrichment', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const dataValue = padHex(numberToHex(1), { size: 16 });
    const event = makeDataChanged(LSP29DataKeys['LSP29EncryptedAssets[]'].length, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(1);
    expect(batchCtx._enrichmentQueue[0]).toMatchObject({
      category: EntityCategory.UniversalProfile,
      address: ADDRESS,
      entityType: 'LSP29EncryptedAssetsLength',
      fkField: 'universalProfile',
    });
  });
});

describe('LSP29EncryptedAssetHandler - Index key', () => {
  it('creates LSP29EncryptedAsset with arrayIndex from data key', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // Build a 32-byte index data key: first 16 bytes = index prefix, last 16 bytes = index 0
    const indexPrefix = LSP29DataKeys['LSP29EncryptedAssets[]'].index;
    const dataKey = indexPrefix + padHex(numberToHex(0), { size: 16 }).slice(2);

    // VerifiableURI-encoded empty → url = null, no error for 0x/empty
    const event = makeDataChanged(dataKey, '0x');
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    expect(assetCalls.length).toBe(1);
    const entity = assetCalls[0][2] as LSP29EncryptedAsset;
    expect(entity.id).toBe(`${ADDRESS} - ${dataKey}`);
    expect(entity.address).toBe(ADDRESS);
    expect(entity.arrayIndex).toBe(0n);
    expect(entity.url).toBeNull();
    expect(entity.isDataFetched).toBe(false);
    expect(entity.retryCount).toBe(0);
  });

  it('extracts arrayIndex=5 from data key', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const indexPrefix = LSP29DataKeys['LSP29EncryptedAssets[]'].index;
    const dataKey = indexPrefix + padHex(numberToHex(5), { size: 16 }).slice(2);

    const event = makeDataChanged(dataKey, '0x');
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    expect(assetCalls.length).toBe(1);
    expect((assetCalls[0][2] as LSP29EncryptedAsset).arrayIndex).toBe(5n);
  });

  it('queues UP enrichment', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const indexPrefix = LSP29DataKeys['LSP29EncryptedAssets[]'].index;
    const dataKey = indexPrefix + padHex(numberToHex(0), { size: 16 }).slice(2);

    const event = makeDataChanged(dataKey, '0x');
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(1);
    expect(batchCtx._enrichmentQueue[0]).toMatchObject({
      category: EntityCategory.UniversalProfile,
      address: ADDRESS,
      entityType: 'LSP29EncryptedAsset',
      fkField: 'universalProfile',
    });
  });
});

describe('LSP29EncryptedAssetHandler - Map key', () => {
  it('creates LSP29EncryptedAssetEntry with contentIdHash and arrayIndex', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // Map key: 10-byte prefix + 2-byte separator (0000) + 20-byte hash
    const mapPrefix = LSP29DataKeys.LSP29EncryptedAssetsMap;
    const contentIdHashBytes = '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataKey = mapPrefix + contentIdHashBytes;

    // 16-byte uint128 array index = 2
    const dataValue = padHex(numberToHex(2), { size: 16 });
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const entryCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetEntry',
    );
    expect(entryCalls.length).toBe(1);
    const entity = entryCalls[0][2] as LSP29EncryptedAssetEntry;
    expect(entity.address).toBe(ADDRESS);
    expect(entity.arrayIndex).toBe(2n);
    expect(entity.contentIdHash).toBeDefined();
  });

  it('stores null arrayIndex for non-16-byte data value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const mapPrefix = LSP29DataKeys.LSP29EncryptedAssetsMap;
    const contentIdHashBytes = '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataKey = mapPrefix + contentIdHashBytes;

    // 8 bytes — not 16
    const dataValue = padHex('0x01', { size: 8 });
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const entryCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetEntry',
    );
    expect(entryCalls.length).toBe(1);
    expect((entryCalls[0][2] as LSP29EncryptedAssetEntry).arrayIndex).toBeNull();
  });

  it('queues UP enrichment', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const mapPrefix = LSP29DataKeys.LSP29EncryptedAssetsMap;
    const dataKey = mapPrefix + '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataValue = padHex(numberToHex(0), { size: 16 });
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(1);
    expect(batchCtx._enrichmentQueue[0]).toMatchObject({
      category: EntityCategory.UniversalProfile,
      entityType: 'LSP29EncryptedAssetEntry',
      fkField: 'universalProfile',
    });
  });
});

describe('LSP29EncryptedAssetHandler - Revision count key', () => {
  it('creates LSP29EncryptedAssetRevisionCount from valid uint128', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const revPrefix = LSP29DataKeys.LSP29EncryptedAssetRevisionCount;
    const contentIdHashBytes = '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataKey = revPrefix + contentIdHashBytes;

    // 16-byte uint128 = 7
    const dataValue = padHex(numberToHex(7), { size: 16 });
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const revCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetRevisionCount',
    );
    expect(revCalls.length).toBe(1);
    const entity = revCalls[0][2] as LSP29EncryptedAssetRevisionCount;
    expect(entity.address).toBe(ADDRESS);
    expect(entity.revisionCount).toBe(7n);
    expect(entity.rawValue).toBe(dataValue);
  });

  it('stores null revisionCount for non-16-byte data value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const revPrefix = LSP29DataKeys.LSP29EncryptedAssetRevisionCount;
    const dataKey = revPrefix + '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataValue = '0x';
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    const revCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetRevisionCount',
    );
    expect(revCalls.length).toBe(1);
    expect((revCalls[0][2] as LSP29EncryptedAssetRevisionCount).revisionCount).toBeNull();
  });

  it('queues UP enrichment', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const revPrefix = LSP29DataKeys.LSP29EncryptedAssetRevisionCount;
    const dataKey = revPrefix + '0000aabbccddee00112233445566778899aabbccddee001122';
    const dataValue = padHex(numberToHex(1), { size: 16 });
    const event = makeDataChanged(dataKey, dataValue);
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(1);
    expect(batchCtx._enrichmentQueue[0]).toMatchObject({
      category: EntityCategory.UniversalProfile,
      entityType: 'LSP29EncryptedAssetRevisionCount',
      fkField: 'universalProfile',
    });
  });
});

describe('LSP29EncryptedAssetHandler - Routing', () => {
  it('ignores unrelated data keys', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const event = makeDataChanged(
      '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
      '0x01',
    );
    batchCtx._entityBags.set('DataChanged', new Map([['dc-test-1', event]]));

    await LSP29EncryptedAssetHandler.handle(hctx, 'DataChanged');

    expect(batchCtx.addEntity).not.toHaveBeenCalled();
    expect(batchCtx.queueEnrichment).not.toHaveBeenCalled();
  });
});
