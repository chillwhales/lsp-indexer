/**
 * Unit tests for UniversalProfileOwner handler.
 *
 * Test cases:
 * - Should create owner entities for verified UPs from OwnershipTransferred events
 * - Should ignore events from non-verified addresses
 * - Should deduplicate using Map (last-writer-wins)
 * - Should queue enrichment for FK resolution
 * - Should handle empty event bags
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { OwnershipTransferred, UniversalProfileOwner } from '@chillwhales/typeorm';
import { describe, expect, it, vi } from 'vitest';
import UniversalProfileOwnerHandler from '../universalProfileOwner.handler';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  getVerified: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
  _enrichmentQueue: unknown[];
  _verifiedUPs: Set<string>;
} {
  const entityBags = new Map<string, Map<string, unknown>>();
  const enrichmentQueue: unknown[] = [];
  const verifiedUPs = new Set<string>();

  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    getVerified: vi.fn((category: EntityCategory) => {
      if (category === EntityCategory.UniversalProfile) {
        return { valid: verifiedUPs, invalid: new Set<string>() };
      }
      return { valid: new Set<string>(), invalid: new Set<string>() };
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
    _verifiedUPs: verifiedUPs,
  };
}

// ---------------------------------------------------------------------------
// Mock HandlerContext helper
// ---------------------------------------------------------------------------
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
// Test data factory
// ---------------------------------------------------------------------------
function createOwnershipTransferred(
  overrides: Partial<OwnershipTransferred> = {},
): OwnershipTransferred {
  return new OwnershipTransferred({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    blockNumber: 100,
    logIndex: 0,
    transactionIndex: 0,
    address: '0xAAA0000000000000000000000000000000000001',
    previousOwner: '0x0000000000000000000000000000000000000000',
    newOwner: '0xBBB0000000000000000000000000000000000002',
    ...overrides,
  });
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('UniversalProfileOwnerHandler', () => {
  describe('creates owner entities for verified UPs', () => {
    it('creates UniversalProfileOwner for verified UP from OwnershipTransferred event', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress = '0xAAA0000000000000000000000000000000000001';
      const newOwner = '0xBBB0000000000000000000000000000000000002';

      // Mark UP as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress);

      const event = createOwnershipTransferred({
        address: upAddress,
        newOwner,
      });

      batchCtx._entityBags.set('OwnershipTransferred', new Map([[event.id, event]]));

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // Should create UniversalProfileOwner entity
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'UniversalProfileOwner',
        upAddress,
        expect.objectContaining({
          id: upAddress,
          address: newOwner,
          timestamp: event.timestamp,
        }),
      );
    });

    it('sets universalProfile FK to null initially', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress = '0xAAA0000000000000000000000000000000000001';

      // Mark UP as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress);

      const event = createOwnershipTransferred({ address: upAddress });
      batchCtx._entityBags.set('OwnershipTransferred', new Map([[event.id, event]]));

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      const addedEntity = batchCtx.addEntity.mock.calls[0][2] as UniversalProfileOwner;
      expect(addedEntity.universalProfile).toBeNull();
    });

    it('queues enrichment for universalProfile FK', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress = '0xAAA0000000000000000000000000000000000001';

      // Mark UP as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress);

      const event = createOwnershipTransferred({ address: upAddress });
      batchCtx._entityBags.set('OwnershipTransferred', new Map([[event.id, event]]));

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith({
        category: EntityCategory.UniversalProfile,
        address: upAddress,
        entityType: 'UniversalProfileOwner',
        entityId: upAddress,
        fkField: 'universalProfile',
        blockNumber: 100,
        transactionIndex: 0,
        logIndex: 0,
      });
    });
  });

  describe('ignores events from non-verified addresses', () => {
    it('does not create owner entity for non-verified address', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const nonVerifiedAddress = '0xCCC0000000000000000000000000000000000003';

      // Do NOT mark as verified
      const event = createOwnershipTransferred({ address: nonVerifiedAddress });
      batchCtx._entityBags.set('OwnershipTransferred', new Map([[event.id, event]]));

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // Should not create any entity
      expect(batchCtx.addEntity).not.toHaveBeenCalled();
    });

    it('does not queue enrichment for non-verified address', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const nonVerifiedAddress = '0xCCC0000000000000000000000000000000000003';

      const event = createOwnershipTransferred({ address: nonVerifiedAddress });
      batchCtx._entityBags.set('OwnershipTransferred', new Map([[event.id, event]]));

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      expect(batchCtx.queueEnrichment).not.toHaveBeenCalled();
    });

    it('processes only verified UPs when mixed with non-verified', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const verifiedAddress = '0xAAA0000000000000000000000000000000000001';
      const nonVerifiedAddress = '0xCCC0000000000000000000000000000000000003';

      // Mark only one as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(verifiedAddress);

      const event1 = createOwnershipTransferred({
        id: 'uuid-1',
        address: verifiedAddress,
        newOwner: '0xBBB0000000000000000000000000000000000002',
      });
      const event2 = createOwnershipTransferred({
        id: 'uuid-2',
        address: nonVerifiedAddress,
        newOwner: '0xDDD0000000000000000000000000000000000004',
      });

      batchCtx._entityBags.set(
        'OwnershipTransferred',
        new Map([
          [event1.id, event1],
          [event2.id, event2],
        ]),
      );

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // Should create only one entity (verified)
      expect(batchCtx.addEntity).toHaveBeenCalledTimes(1);
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'UniversalProfileOwner',
        verifiedAddress,
        expect.objectContaining({ id: verifiedAddress }),
      );

      // Should queue only one enrichment
      expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(1);
    });
  });

  describe('deduplicates using Map (last-writer-wins)', () => {
    it('keeps last event when multiple OwnershipTransferred events for same UP', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress = '0xAAA0000000000000000000000000000000000001';
      const firstOwner = '0xBBB0000000000000000000000000000000000002';
      const secondOwner = '0xCCC0000000000000000000000000000000000003';

      // Mark UP as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress);

      const event1 = createOwnershipTransferred({
        id: 'uuid-1',
        address: upAddress,
        newOwner: firstOwner,
        timestamp: new Date('2024-01-01T00:00:00Z'),
      });

      const event2 = createOwnershipTransferred({
        id: 'uuid-2',
        address: upAddress,
        newOwner: secondOwner,
        timestamp: new Date('2024-01-01T01:00:00Z'),
      });

      batchCtx._entityBags.set(
        'OwnershipTransferred',
        new Map([
          [event1.id, event1],
          [event2.id, event2],
        ]),
      );

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // Should call addEntity only once for the deduplicated result
      expect(batchCtx.addEntity).toHaveBeenCalledTimes(1);

      // Should have the last owner's address
      const addedEntity = batchCtx.addEntity.mock.calls[0][2] as UniversalProfileOwner;
      expect(addedEntity.address).toBe(secondOwner);
      expect(addedEntity.timestamp).toEqual(new Date('2024-01-01T01:00:00Z'));
    });

    it('queues enrichment only once per deduplicated entity', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress = '0xAAA0000000000000000000000000000000000001';

      // Mark UP as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress);

      const event1 = createOwnershipTransferred({
        id: 'uuid-1',
        address: upAddress,
        newOwner: '0xBBB0000000000000000000000000000000000002',
      });

      const event2 = createOwnershipTransferred({
        id: 'uuid-2',
        address: upAddress,
        newOwner: '0xCCC0000000000000000000000000000000000003',
      });

      batchCtx._entityBags.set(
        'OwnershipTransferred',
        new Map([
          [event1.id, event1],
          [event2.id, event2],
        ]),
      );

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // queueEnrichment is called per event (before dedup), so 2 events = 2 calls
      expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(2);
    });
  });

  describe('handles empty event bags', () => {
    it('returns early when no OwnershipTransferred events exist', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      // Empty bag
      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      expect(batchCtx.addEntity).not.toHaveBeenCalled();
      expect(batchCtx.queueEnrichment).not.toHaveBeenCalled();
    });
  });

  describe('processes multiple verified UPs', () => {
    it('creates owner entities for multiple verified UPs', async () => {
      const batchCtx = createMockBatchCtx();
      const hctx = createMockHandlerContext(batchCtx);

      const upAddress1 = '0xAAA0000000000000000000000000000000000001';
      const upAddress2 = '0xBBB0000000000000000000000000000000000002';

      // Mark both as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (batchCtx as any)._verifiedUPs.add(upAddress2);

      const event1 = createOwnershipTransferred({
        id: 'uuid-1',
        address: upAddress1,
        newOwner: '0xCCC0000000000000000000000000000000000003',
      });

      const event2 = createOwnershipTransferred({
        id: 'uuid-2',
        address: upAddress2,
        newOwner: '0xDDD0000000000000000000000000000000000004',
      });

      batchCtx._entityBags.set(
        'OwnershipTransferred',
        new Map([
          [event1.id, event1],
          [event2.id, event2],
        ]),
      );

      await UniversalProfileOwnerHandler.handle(hctx, 'OwnershipTransferred');

      // Should create two entities
      expect(batchCtx.addEntity).toHaveBeenCalledTimes(2);
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'UniversalProfileOwner',
        upAddress1,
        expect.objectContaining({ id: upAddress1 }),
      );
      expect(batchCtx.addEntity).toHaveBeenCalledWith(
        'UniversalProfileOwner',
        upAddress2,
        expect.objectContaining({ id: upAddress2 }),
      );

      // Should queue two enrichments
      expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(2);
    });
  });
});
