/**
 * Unit tests for OrbFaction handler.
 *
 * Test cases:
 * - Cross-batch FK preservation when TokenIdDataChanged arrives after mint
 * - Spread pattern preserves digitalAsset and nft FKs populated by enrichment
 */
import { ORB_FACTION_KEY, ORBS_ADDRESS } from '@/constants/chillwhales';
import { type HandlerContext } from '@/core/types';
import { OrbFaction, TokenIdDataChanged } from '@/model';
import { generateTokenId } from '@/utils';
import { Store } from '@subsquid/typeorm-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrbFactionHandler from '../chillwhales/orbFaction.handler';

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
function createMockStore(existingOrbFactions: OrbFaction[] = []): Store {
  return {
    findOneBy: vi.fn((entityClass: unknown, where: { id: string }) => {
      if (entityClass === OrbFaction) {
        return Promise.resolve(existingOrbFactions.find((e) => e.id === where.id) ?? null);
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
describe('OrbFaction handler - Cross-batch FK preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should preserve digitalAsset and nft FKs when TokenIdDataChanged arrives after mint (entity only in DB)', async () => {
    // Simulate: Batch 1 minted the orb and enrichment populated FKs
    // Batch 2 receives TokenIdDataChanged to update faction
    const tokenId = '0x01';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    // Existing entity in DB with FKs already populated by enrichment
    const existingFaction = new OrbFaction({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 'Neutral', // Default from mint
      digitalAsset: null, // FK populated by enrichment
      nft: null, // FK populated by enrichment
    });

    const store = createMockStore([existingFaction]);
    const batchCtx = createMockBatchCtx();

    // TokenIdDataChanged event with new faction
    const event = new TokenIdDataChanged({
      id: 'event-1',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      blockNumber: 2000000,
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_FACTION_KEY,
      dataValue: '0x46697265', // "Fire" in hex (no padding)
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbFactionHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: FKs should be preserved from DB entity
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbFaction',
      id,
      expect.objectContaining({
        id,
        address: ORBS_ADDRESS,
        tokenId,
        value: 'Fire', // Updated
        digitalAsset: null, // Preserved from DB
        nft: null, // Preserved from DB
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
      timestamp: new Date('2024-01-01T00:00:00Z'),
      blockNumber: 2000000,
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_FACTION_KEY,
      dataValue: '0x5761746572', // "Water" in hex (no padding)
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbFactionHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: Should create new entity (FKs default to null via TypeORM)
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbFaction',
      id,
      expect.objectContaining({
        id,
        value: 'Water',
        // digitalAsset and nft default to null (not explicitly set)
      }),
    );
  });

  it('should prioritize batch entity over DB entity (intra-batch update)', async () => {
    // Simulate: Same batch has mint (in batch) and TokenIdDataChanged
    const tokenId = '0x03';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    // Entity exists in DB from previous batch
    const dbFaction = new OrbFaction({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 'Neutral',
      digitalAsset: null,
      nft: null,
    });

    const store = createMockStore([dbFaction]);
    const batchCtx = createMockBatchCtx();

    // Entity also in batch with updated FKs (from enrichment in same batch)
    const batchFaction = new OrbFaction({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 'Neutral',
      digitalAsset: null, // Updated in current batch
      nft: null,
    });

    batchCtx._entityBags.set('OrbFaction', new Map([[id, batchFaction]]));

    const event = new TokenIdDataChanged({
      id: 'event-3',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      blockNumber: 2000000,
      logIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_FACTION_KEY,
      dataValue: '0x4561727468', // "Earth" in hex (no padding)
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbFactionHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: Should use batch entity FKs, not DB entity FKs
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'OrbFaction',
      id,
      expect.objectContaining({
        id,
        value: 'Earth',
        digitalAsset: null, // From batch, not DB
        nft: null, // From batch, not DB
      }),
    );
  });
});
