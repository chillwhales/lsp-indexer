/**
 * Unit tests for OrbsClaimed handler.
 *
 * Test cases (Phase 1 - Mint Detection):
 * - Should create entities with value=false for mint transfers (from=zero)
 * - Should ignore non-mint transfers
 * - Should filter by CHILLWHALES_ADDRESS
 * - Should queue enrichment for digitalAsset and nft FKs
 *
 * Test cases (Phase 2 - On-chain Verification):
 * - Should skip verification when isHead=false
 * - Should query unclaimed entities when isHead=true
 * - Should update entities to value=true for successful multicall results
 * - Should handle multicall errors gracefully
 * - Should handle empty unclaimed results
 */
import { CHILLWHALES_ADDRESS } from '@/constants/chillwhales';
import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, type HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { OrbsClaimed, Transfer } from '@/model';
import { Store } from '@subsquid/typeorm-store';
import { zeroAddress } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrbsClaimedHandler from '../chillwhales/orbsClaimed.handler';

// Mock the multicall module
vi.mock('@/core/multicall', () => ({
  aggregate3StaticLatest: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
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
      entityBags.get(type)?.set(id, entity);
    }),
    queueEnrichment: vi.fn((request: unknown) => {
      enrichmentQueue.push(request);
    }),
    // Test accessors
    _entityBags: entityBags,
    _enrichmentQueue: enrichmentQueue,
  };
}

// ---------------------------------------------------------------------------
// Mock Store helper
// ---------------------------------------------------------------------------
function createMockStore(existingOrbsClaimed: OrbsClaimed[] = []): Store {
  return {
    findBy: vi.fn((entityClass: unknown, where: { value: boolean }) => {
      if (entityClass === OrbsClaimed) {
        return Promise.resolve(existingOrbsClaimed.filter((e) => e.value === where.value));
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
  isHead = false,
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
    isHead,
    batchCtx: batchCtx as unknown as HandlerContext['batchCtx'],
    workerPool: {} as HandlerContext['workerPool'],
  } as HandlerContext;
}

// ---------------------------------------------------------------------------
// Test data factory
// ---------------------------------------------------------------------------
function createTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return new Transfer({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    blockNumber: 100,
    logIndex: 0,
    transactionIndex: 0,
    address: CHILLWHALES_ADDRESS,
    from: zeroAddress,
    to: '0xBBB0000000000000000000000000000000000002',
    amount: 1n,
    tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
    operator: zeroAddress,
    force: false,
    data: '0x',
    digitalAsset: null,
    fromProfile: null,
    toProfile: null,
    operatorProfile: null,
    nft: null,
    ...overrides,
  });
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('OrbsClaimedHandler - Phase 1 (Mint Detection)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('creates entities with value=false for mint transfers', () => {
    it('creates OrbsClaimed entity for Chillwhale mint (from zero address)', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const transfer = createTransfer({
        from: zeroAddress,
        to: '0xBBB0000000000000000000000000000000000002',
        tokenId,
      });

      batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      const expectedId = generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId });

      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'OrbsClaimed',
        expectedId,
        expect.objectContaining({
          id: expectedId,
          address: CHILLWHALES_ADDRESS,
          tokenId,
          value: false,
        }),
      );
    });

    it('sets FK fields to null initially', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const transfer = createTransfer();
      batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      const addedEntity = batchCtx.addEntity.mock.calls[0][2] as OrbsClaimed;
      expect(addedEntity.digitalAsset).toBeNull();
      expect(addedEntity.nft).toBeNull();
    });

    it('queues enrichment for digitalAsset and nft FKs', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const transfer = createTransfer({ tokenId });
      batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      const expectedId = generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId });

      // Should queue enrichment for digitalAsset FK
      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith({
        category: EntityCategory.DigitalAsset,
        address: CHILLWHALES_ADDRESS,
        entityType: 'OrbsClaimed',
        entityId: expectedId,
        fkField: 'digitalAsset',
        timestamp: new Date('2024-01-01T00:00:00Z').getTime(),
        blockNumber: 100,
        transactionIndex: 0,
        logIndex: 0,
      });

      // Should queue enrichment for nft FK
      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith({
        category: EntityCategory.NFT,
        address: CHILLWHALES_ADDRESS,
        tokenId,
        entityType: 'OrbsClaimed',
        entityId: expectedId,
        fkField: 'nft',
        timestamp: new Date('2024-01-01T00:00:00Z').getTime(),
        blockNumber: 100,
        transactionIndex: 0,
        logIndex: 0,
      });
    });
  });

  describe('ignores non-mint transfers', () => {
    it('does not create entity for regular transfer (non-zero from address)', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const transfer = createTransfer({
        from: '0xAAA0000000000000000000000000000000000001', // Not zero address
        to: '0xBBB0000000000000000000000000000000000002',
      });

      batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      expect(batchCtx.addEntity).not.toHaveBeenCalled();
      expect(batchCtx.queueEnrichment).not.toHaveBeenCalled();
    });
  });

  describe('filters by CHILLWHALES_ADDRESS', () => {
    it('does not create entity for mint from different NFT contract', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const transfer = createTransfer({
        address: '0x0000000000000000000000000000000000000001', // Different address
        from: zeroAddress,
      });

      batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      expect(batchCtx.addEntity).not.toHaveBeenCalled();
    });

    it('creates entity only for CHILLWHALES_ADDRESS mints', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      const chillwhaleTransfer = createTransfer({
        id: 'uuid-1',
        address: CHILLWHALES_ADDRESS,
        from: zeroAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      const otherTransfer = createTransfer({
        id: 'uuid-2',
        address: '0x0000000000000000000000000000000000000001',
        from: zeroAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000002',
      });

      batchCtx._entityBags.set(
        'LSP8Transfer',
        new Map([
          [chillwhaleTransfer.id, chillwhaleTransfer],
          [otherTransfer.id, otherTransfer],
        ]),
      );

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should create only one entity (for Chillwhale)
      expect(batchCtx.addEntity).toHaveBeenCalledTimes(1);
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'OrbsClaimed',
        expect.any(String),
        expect.objectContaining({
          address: CHILLWHALES_ADDRESS,
        }),
      );
    });
  });

  describe('handles empty event bags', () => {
    it('returns early when no LSP8Transfer events exist', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false);

      // Empty bag
      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      expect(batchCtx.addEntity).not.toHaveBeenCalled();
      expect(batchCtx.queueEnrichment).not.toHaveBeenCalled();
    });
  });
});

describe('OrbsClaimedHandler - Phase 2 (On-chain Verification)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('skips verification when isHead=false', () => {
    it('does not query database or make RPC calls when not at head', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store, false); // isHead=false

      // Empty transfer bag (phase 1 would have processed already)
      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should not call store.findBy
      expect(store.findBy).not.toHaveBeenCalled();

      // Should not call multicall
      expect(aggregate3StaticLatest).not.toHaveBeenCalled();
    });
  });

  describe('queries unclaimed entities when isHead=true', () => {
    it('queries database for unclaimed OrbsClaimed entities (value=false)', async () => {
      const batchCtx = createMockBatchCtx();
      const unclaimedEntity = new OrbsClaimed({
        id: generateTokenId({
          address: CHILLWHALES_ADDRESS,
          tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }),
        address: CHILLWHALES_ADDRESS,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimedEntity]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall response
      vi.mocked(aggregate3StaticLatest).mockResolvedValue([
        {
          success: true,
          returnData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        }, // false
      ]);

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should query for unclaimed entities
      expect(store.findBy).toHaveBeenCalledWith(OrbsClaimed, { value: false });
    });

    it('does not make RPC calls when no unclaimed entities exist', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore([]); // No unclaimed entities
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should query database
      expect(store.findBy).toHaveBeenCalledWith(OrbsClaimed, { value: false });

      // Should NOT call multicall
      expect(aggregate3StaticLatest).not.toHaveBeenCalled();
    });
  });

  describe('updates entities to value=true for successful multicall results', () => {
    it('updates entity when multicall returns true (claimed)', async () => {
      const batchCtx = createMockBatchCtx();
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const unclaimedEntity = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
        address: CHILLWHALES_ADDRESS,
        tokenId,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimedEntity]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall response: true (claimed)
      vi.mocked(aggregate3StaticLatest).mockResolvedValue([
        {
          success: true,
          returnData: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }, // true
      ]);

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      const expectedId = generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId });

      // Should update entity with value=true
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'OrbsClaimed',
        expectedId,
        expect.objectContaining({
          id: expectedId,
          value: true,
        }),
      );
    });

    it('does not update entity when multicall returns false (not claimed)', async () => {
      const batchCtx = createMockBatchCtx();
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const unclaimedEntity = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
        address: CHILLWHALES_ADDRESS,
        tokenId,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimedEntity]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall response: false (not claimed)
      vi.mocked(aggregate3StaticLatest).mockResolvedValue([
        {
          success: true,
          returnData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        }, // false
      ]);

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should NOT update entity
      expect(batchCtx.addEntity).not.toHaveBeenCalled();
    });

    it('updates multiple entities when multicall returns mixed results', async () => {
      const batchCtx = createMockBatchCtx();
      const tokenId1 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const tokenId2 = '0x0000000000000000000000000000000000000000000000000000000000000002';

      const unclaimed1 = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: tokenId1 }),
        address: CHILLWHALES_ADDRESS,
        tokenId: tokenId1,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const unclaimed2 = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId: tokenId2 }),
        address: CHILLWHALES_ADDRESS,
        tokenId: tokenId2,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimed1, unclaimed2]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall response: first is claimed, second is not
      vi.mocked(aggregate3StaticLatest).mockResolvedValue([
        {
          success: true,
          returnData: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }, // true
        {
          success: true,
          returnData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        }, // false
      ]);

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should update only the first entity
      expect(batchCtx.addEntity).toHaveBeenCalledTimes(1);
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'OrbsClaimed',
        unclaimed1.id,
        expect.objectContaining({
          value: true,
        }),
      );
    });
  });

  describe('handles multicall errors gracefully', () => {
    it('does not update entities when multicall fails', async () => {
      const batchCtx = createMockBatchCtx();
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const unclaimedEntity = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
        address: CHILLWHALES_ADDRESS,
        tokenId,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimedEntity]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall error
      vi.mocked(aggregate3StaticLatest).mockRejectedValue(new Error('RPC error'));

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should NOT update entity
      expect(batchCtx.addEntity).not.toHaveBeenCalled();

      // Should log warning
      expect(hctx.context.log.warn).toHaveBeenCalled();
    });

    it('does not update entity when multicall result has success=false', async () => {
      const batchCtx = createMockBatchCtx();
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const unclaimedEntity = new OrbsClaimed({
        id: generateTokenId({ address: CHILLWHALES_ADDRESS, tokenId }),
        address: CHILLWHALES_ADDRESS,
        tokenId,
        digitalAsset: null,
        nft: null,
        value: false,
      });

      const store = createMockStore([unclaimedEntity]);
      const hctx = createMockHandlerContext(batchCtx, store, true); // isHead=true

      // Mock multicall response with success=false
      vi.mocked(aggregate3StaticLatest).mockResolvedValue([{ success: false, returnData: '0x' }]);

      await OrbsClaimedHandler.handle(hctx, 'LSP8Transfer');

      // Should NOT update entity
      expect(batchCtx.addEntity).not.toHaveBeenCalled();
    });
  });
});
