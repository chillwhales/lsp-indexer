/**
 * Unit tests for OrbLevel handler.
 *
 * Test cases:
 * - Cross-batch FK preservation when TokenIdDataChanged arrives after mint
 * - Spread pattern preserves digitalAsset and nft FKs populated by enrichment
 */
import { ORB_LEVEL_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { type HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbCooldownExpiry, OrbLevel, TokenIdDataChanged } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrbLevelHandler from '../chillwhales/orbLevel.handler';

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
function createMockStore(
  existingOrbLevels: OrbLevel[] = [],
  existingOrbCooldowns: OrbCooldownExpiry[] = [],
): Store {
  return {
    findOneBy: vi.fn((entityClass: unknown, where: { id: string }) => {
      if (entityClass === OrbLevel) {
        return Promise.resolve(existingOrbLevels.find((e) => e.id === where.id) ?? null);
      }
      if (entityClass === OrbCooldownExpiry) {
        return Promise.resolve(existingOrbCooldowns.find((e) => e.id === where.id) ?? null);
      }
      return Promise.resolve(null);
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
// Tests
// ---------------------------------------------------------------------------
describe('OrbLevel handler - Cross-batch FK preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should preserve digitalAsset and nft FKs when TokenIdDataChanged arrives after mint (entity only in DB)', async () => {
    // Simulate: Batch 1 minted the orb and enrichment populated FKs
    // Batch 2 receives TokenIdDataChanged to update level
    const tokenId = '0x01';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    // Existing entity in DB with FKs already populated by enrichment
    const existingLevel = new OrbLevel({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0, // Default from mint
      digitalAsset: 'digital-asset-id-123', // FK populated by enrichment
      nft: 'nft-id-456', // FK populated by enrichment
    });

    const existingCooldown = new OrbCooldownExpiry({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      digitalAsset: 'digital-asset-id-123',
      nft: 'nft-id-456',
    });

    const store = createMockStore([existingLevel], [existingCooldown]);
    const batchCtx = createMockBatchCtx();

    // TokenIdDataChanged event with packed level + cooldown
    const event = new TokenIdDataChanged({
      id: 'event-1',
      blockNumber: 2000000,
      blockTimestamp: 1700000000,
      transactionHash: '0xabc',
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_LEVEL_KEY,
      dataValue: '0x0000000500000064', // level=5, cooldown=100
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbLevelHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: FKs should be preserved from DB entity
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbLevel',
      id,
      expect.objectContaining({
        id,
        address: ORBS_ADDRESS,
        tokenId,
        value: 5, // Updated
        digitalAsset: 'digital-asset-id-123', // Preserved from DB
        nft: 'nft-id-456', // Preserved from DB
      }),
    );

    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbCooldownExpiry',
      id,
      expect.objectContaining({
        id,
        address: ORBS_ADDRESS,
        tokenId,
        value: 100, // Updated
        digitalAsset: 'digital-asset-id-123', // Preserved from DB
        nft: 'nft-id-456', // Preserved from DB
      }),
    );
  });

  it('should handle entity not found in batch or DB (first TokenIdDataChanged before mint)', async () => {
    // Edge case: TokenIdDataChanged arrives before Transfer mint event
    const tokenId = '0x02';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    const store = createMockStore(); // Empty DB
    const batchCtx = createMockBatchCtx();

    const event = new TokenIdDataChanged({
      id: 'event-2',
      blockNumber: 2000000,
      blockTimestamp: 1700000000,
      transactionHash: '0xdef',
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_LEVEL_KEY,
      dataValue: '0x0000000300000032', // level=3, cooldown=50
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbLevelHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: Should create new entities (FKs default to null via TypeORM)
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbLevel',
      id,
      expect.objectContaining({
        id,
        value: 3,
        // digitalAsset and nft default to null (not explicitly set)
      }),
    );

    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbCooldownExpiry',
      id,
      expect.objectContaining({
        id,
        value: 50,
        // digitalAsset and nft default to null (not explicitly set)
      }),
    );
  });

  it('should prioritize batch entity over DB entity (intra-batch update)', async () => {
    // Simulate: Same batch has mint (in batch) and TokenIdDataChanged
    const tokenId = '0x03';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    // Entity exists in DB from previous batch
    const dbLevel = new OrbLevel({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 1,
      digitalAsset: 'old-digital-asset',
      nft: 'old-nft',
    });

    const dbCooldown = new OrbCooldownExpiry({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 10,
      digitalAsset: 'old-digital-asset',
      nft: 'old-nft',
    });

    const store = createMockStore([dbLevel], [dbCooldown]);
    const batchCtx = createMockBatchCtx();

    // Entity also in batch with updated FKs (from enrichment in same batch)
    const batchLevel = new OrbLevel({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      digitalAsset: 'new-digital-asset', // Updated in current batch
      nft: 'new-nft',
    });

    batchCtx._entityBags.set('OrbLevel', new Map([[id, batchLevel]]));

    const event = new TokenIdDataChanged({
      id: 'event-3',
      blockNumber: 2000000,
      blockTimestamp: 1700000000,
      transactionHash: '0xghi',
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_LEVEL_KEY,
      dataValue: '0x0000000700000078', // level=7, cooldown=120
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbLevelHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: Should use batch entity FKs, not DB entity FKs
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbLevel',
      id,
      expect.objectContaining({
        id,
        value: 7,
        digitalAsset: 'new-digital-asset', // From batch, not DB
        nft: 'new-nft', // From batch, not DB
      }),
    );
  });
});
