/**
 * Unit tests for Follower EntityHandler.
 *
 * Covers:
 * - HNDL-01: Follow events create Follower entities with deterministic IDs
 * - HNDL-02: Unfollow events queue deletion of Follower entities using unfollowedAddress
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { generateFollowId } from '@/utils';
import { Follow, Follower, Unfollow } from '@chillwhales/typeorm';
import { describe, expect, it, vi } from 'vitest';
import FollowerHandler from '../follower.handler';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  hasEntities: ReturnType<typeof vi.fn>;
  queueDelete: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  queueClear: ReturnType<typeof vi.fn>;
  setPersistHint: ReturnType<typeof vi.fn>;
  removeEntity: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
  _deleteQueue: unknown[];
  _enrichmentQueue: unknown[];
} {
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
    hasEntities: vi.fn((type: string) => entityBags.has(type) && entityBags.get(type).size > 0),
    queueDelete: vi.fn((request: unknown) => deleteQueue.push(request)),
    queueEnrichment: vi.fn((request: unknown) => enrichmentQueue.push(request)),
    queueClear: vi.fn(),
    setPersistHint: vi.fn(),
    removeEntity: vi.fn(),
    // Test accessors
    _entityBags: entityBags,
    _deleteQueue: deleteQueue,
    _enrichmentQueue: enrichmentQueue,
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
function createFollow(overrides: Partial<Follow> = {}): Follow {
  return new Follow({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    blockNumber: 100,
    logIndex: 0,
    transactionIndex: 0,
    address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
    followerAddress: '0xAAA0000000000000000000000000000000000001',
    followedAddress: '0xBBB0000000000000000000000000000000000002',
    followerUniversalProfile: null,
    followedUniversalProfile: null,
    ...overrides,
  });
}

function createUnfollow(overrides: Partial<Unfollow> = {}): Unfollow {
  return new Unfollow({
    id: 'test-uuid-2',
    timestamp: new Date('2024-01-02T00:00:00Z'),
    blockNumber: 200,
    logIndex: 1,
    transactionIndex: 1,
    address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
    followerAddress: '0xAAA0000000000000000000000000000000000001',
    unfollowedAddress: '0xBBB0000000000000000000000000000000000002',
    followerUniversalProfile: null,
    unfollowedUniversalProfile: null,
    ...overrides,
  });
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('FollowerHandler - Follow events (HNDL-01)', () => {
  it('creates Follower entities with deterministic IDs', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // Seed two Follow entities
    const follow1 = createFollow({
      id: 'uuid-1',
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    const follow2 = createFollow({
      id: 'uuid-2',
      followerAddress: '0xCCC0000000000000000000000000000000000003',
      followedAddress: '0xDDD0000000000000000000000000000000000004',
    });
    batchCtx._entityBags.set(
      'Follow',
      new Map([
        [follow1.id, follow1],
        [follow2.id, follow2],
      ]),
    );

    await FollowerHandler.handle(hctx, 'Follow');

    // Verify addEntity called with type 'Follower' and deterministic IDs
    expect(batchCtx.addEntity).toHaveBeenCalledTimes(2);

    const expectedId1 = generateFollowId({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    const expectedId2 = generateFollowId({
      followerAddress: '0xCCC0000000000000000000000000000000000003',
      followedAddress: '0xDDD0000000000000000000000000000000000004',
    });

    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'Follower',
      expectedId1,
      expect.objectContaining({ id: expectedId1 }),
    );
    expect(batchCtx.addEntity).toHaveBeenCalledWith(
      'Follower',
      expectedId2,
      expect.objectContaining({ id: expectedId2 }),
    );
  });

  it('copies all fields from Follow to Follower', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const follow = createFollow({
      id: 'uuid-field-test',
      timestamp: new Date('2024-06-15T12:30:00Z'),
      blockNumber: 5000,
      logIndex: 3,
      transactionIndex: 7,
      address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    batchCtx._entityBags.set('Follow', new Map([[follow.id, follow]]));

    await FollowerHandler.handle(hctx, 'Follow');

    const addedFollower = batchCtx.addEntity.mock.calls[0][2] as Follower;
    expect(addedFollower.timestamp).toEqual(new Date('2024-06-15T12:30:00Z'));
    expect(addedFollower.blockNumber).toBe(5000);
    expect(addedFollower.logIndex).toBe(3);
    expect(addedFollower.transactionIndex).toBe(7);
    expect(addedFollower.address).toBe('0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA');
    expect(addedFollower.followerAddress).toBe('0xAAA0000000000000000000000000000000000001');
    expect(addedFollower.followedAddress).toBe('0xBBB0000000000000000000000000000000000002');
  });

  it('sets FK fields to null', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const follow = createFollow();
    batchCtx._entityBags.set('Follow', new Map([[follow.id, follow]]));

    await FollowerHandler.handle(hctx, 'Follow');

    const addedFollower = batchCtx.addEntity.mock.calls[0][2] as Follower;
    expect(addedFollower.followerUniversalProfile).toBeNull();
    expect(addedFollower.followedUniversalProfile).toBeNull();
  });

  it('queues enrichment for both UP FKs', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const follow = createFollow({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    batchCtx._entityBags.set('Follow', new Map([[follow.id, follow]]));

    await FollowerHandler.handle(hctx, 'Follow');

    // Should queue 2 enrichment requests per Follow entity
    expect(batchCtx.queueEnrichment).toHaveBeenCalledTimes(2);

    const expectedId = generateFollowId({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });

    expect(batchCtx.queueEnrichment).toHaveBeenCalledWith({
      category: EntityCategory.UniversalProfile,
      address: '0xAAA0000000000000000000000000000000000001',
      entityType: 'Follower',
      entityId: expectedId,
      fkField: 'followerUniversalProfile',
      blockNumber: 100,
      transactionIndex: 0,
      logIndex: 0,
    });
    expect(batchCtx.queueEnrichment).toHaveBeenCalledWith({
      category: EntityCategory.UniversalProfile,
      address: '0xBBB0000000000000000000000000000000000002',
      entityType: 'Follower',
      entityId: expectedId,
      fkField: 'followedUniversalProfile',
      blockNumber: 100,
      transactionIndex: 0,
      logIndex: 0,
    });
  });
});

describe('FollowerHandler - Unfollow events (HNDL-02)', () => {
  it('queues deletion with correct deterministic IDs', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const unfollow = createUnfollow({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      unfollowedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    batchCtx._entityBags.set('Unfollow', new Map([[unfollow.id, unfollow]]));

    await FollowerHandler.handle(hctx, 'Unfollow');

    expect(batchCtx.queueDelete).toHaveBeenCalledTimes(1);

    const deleteRequest = batchCtx.queueDelete.mock.calls[0][0] as {
      entityClass: typeof Follower;
      entities: Follower[];
    };
    expect(deleteRequest.entityClass).toBe(Follower);
    expect(deleteRequest.entities).toHaveLength(1);

    const expectedId = generateFollowId({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xBBB0000000000000000000000000000000000002',
    });
    expect(deleteRequest.entities[0].id).toBe(expectedId);
  });

  it('uses unfollowedAddress NOT followedAddress for deletion ID', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // The unfollowedAddress is different from what a followedAddress would be
    const unfollow = createUnfollow({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      unfollowedAddress: '0xEEE0000000000000000000000000000000000005',
    });
    batchCtx._entityBags.set('Unfollow', new Map([[unfollow.id, unfollow]]));

    await FollowerHandler.handle(hctx, 'Unfollow');

    const deleteRequest = batchCtx.queueDelete.mock.calls[0][0] as {
      entityClass: typeof Follower;
      entities: Follower[];
    };

    // The ID should use unfollowedAddress, not any other address
    const correctId = generateFollowId({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xEEE0000000000000000000000000000000000005',
    });
    expect(deleteRequest.entities[0].id).toBe(correctId);

    // Verify it does NOT match some wrong address
    const wrongId = generateFollowId({
      followerAddress: '0xAAA0000000000000000000000000000000000001',
      followedAddress: '0xWRONG',
    });
    expect(deleteRequest.entities[0].id).not.toBe(wrongId);
  });

  it('does not queue deletion when no unfollows exist', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    // Empty Unfollow bag (default — not seeded)
    await FollowerHandler.handle(hctx, 'Unfollow');

    expect(batchCtx.queueDelete).not.toHaveBeenCalled();
  });

  it('does not create Follower entities when triggered by Unfollow', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const unfollow = createUnfollow();
    batchCtx._entityBags.set('Unfollow', new Map([[unfollow.id, unfollow]]));

    await FollowerHandler.handle(hctx, 'Unfollow');

    // addEntity should NOT have been called with 'Follower' type
    const followerCalls = batchCtx.addEntity.mock.calls.filter(
      (call: unknown[]) => call[0] === 'Follower',
    );
    expect(followerCalls).toHaveLength(0);
  });
});
