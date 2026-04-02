/**
 * Unit tests for handlerHelpers.ts
 *
 * Covers:
 * - resolveEntity: single-entity lookup (batch → DB → null)
 * - resolveEntities: bulk entity lookup (batch + DB merge)
 * - Edge cases: empty IDs, batch-only, DB-only, mixed sources
 */
import { DataChanged } from '@/model';
import type { Store } from '@subsquid/typeorm-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveEntities, resolveEntity } from '../handlerHelpers';
import type { IBatchContext } from '../types';

// ---------------------------------------------------------------------------
// Minimal test entity
// ---------------------------------------------------------------------------
class TestEntity {
  id: string;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
  value?: string;
  constructor(props?: Partial<TestEntity>) {
    Object.assign(this, props);
  }
}

// ---------------------------------------------------------------------------
// Mock store
// ---------------------------------------------------------------------------
function createMockStore(): {
  findOneBy: ReturnType<typeof vi.fn>;
  findBy: ReturnType<typeof vi.fn>;
} {
  return {
    findOneBy: vi.fn(),
    findBy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Mock batchCtx with configurable entity bags
// ---------------------------------------------------------------------------
function createMockBatchCtx(entities: Map<string, TestEntity>): IBatchContext {
  return {
    network: 'lukso',
    getEntities: vi.fn(() => entities),
  } as unknown as IBatchContext;
}

// ---------------------------------------------------------------------------
// resolveEntity tests
// ---------------------------------------------------------------------------
describe('resolveEntity', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('returns entity from batch when present (no DB call made)', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);

    const result = await resolveEntity(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      'id-1',
    );

    expect(result).toEqual({ id: 'id-1', value: 'batch' });
    expect(mockStore.findOneBy).not.toHaveBeenCalled();
  });

  it('returns entity from DB when not in batch', async () => {
    const batchEntities = new Map<string, TestEntity>();
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntity = new TestEntity({ id: 'id-2', value: 'db' });
    mockStore.findOneBy.mockResolvedValue(dbEntity);

    const result = await resolveEntity(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      'id-2',
    );

    expect(result).toEqual({ id: 'id-2', value: 'db' });
    // DB query uses the constructor from the registry
    expect(mockStore.findOneBy).toHaveBeenCalledTimes(1);
  });

  it('returns null when entity not in batch and not in DB', async () => {
    const batchEntities = new Map<string, TestEntity>();
    const batchCtx = createMockBatchCtx(batchEntities);
    mockStore.findOneBy.mockResolvedValue(null);

    const result = await resolveEntity(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      'id-3',
    );

    expect(result).toBeNull();
    expect(mockStore.findOneBy).toHaveBeenCalledTimes(1);
  });

  it('batch entity takes priority over DB entity (batch checked first)', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-4', new TestEntity({ id: 'id-4', value: 'batch-wins' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntity = new TestEntity({ id: 'id-4', value: 'db-loses' });
    mockStore.findOneBy.mockResolvedValue(dbEntity);

    const result = await resolveEntity(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      'id-4',
    );

    expect(result).toEqual({ id: 'id-4', value: 'batch-wins' });
    expect(mockStore.findOneBy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// resolveEntities tests
// ---------------------------------------------------------------------------
describe('resolveEntities', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockStore = createMockStore();
  });

  it('returns all batch entities even if not in ids array (preserves full batch map)', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch-1' })],
      ['id-2', new TestEntity({ id: 'id-2', value: 'batch-2' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    mockStore.findBy.mockResolvedValue([]);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1'], // Only requesting id-1
    );

    expect(result.size).toBe(2);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch-1' });
    expect(result.get('id-2')).toEqual({ id: 'id-2', value: 'batch-2' });
  });

  it('queries DB only for IDs not already in batch', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntity = new TestEntity({ id: 'id-2', value: 'db' });
    mockStore.findBy.mockResolvedValue([dbEntity]);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1', 'id-2'], // id-1 in batch, id-2 needs DB query
    );

    expect(result.size).toBe(2);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch' });
    expect(result.get('id-2')).toEqual({ id: 'id-2', value: 'db' });
    // Verify DB query was made with correct IDs (avoid TypeORM internal fields)
    expect(mockStore.findBy).toHaveBeenCalledTimes(1);
    const callArgs = mockStore.findBy.mock.calls[0] as [
      typeof DataChanged,
      { id: { value: string[] } },
    ];
    expect(callArgs[0]).toBe(DataChanged);
    expect(callArgs[1].id.value).toEqual(['id-2']);
  });

  it('returns merged map with batch entities overriding DB entities for same ID', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch-wins' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntity = new TestEntity({ id: 'id-1', value: 'db-loses' });
    mockStore.findBy.mockResolvedValue([dbEntity]);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1'],
    );

    expect(result.size).toBe(1);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch-wins' });
    // No DB query because id-1 already in batch
    expect(mockStore.findBy).not.toHaveBeenCalled();
  });

  it('returns empty map when no batch entities and no DB entities', async () => {
    const batchEntities = new Map<string, TestEntity>();
    const batchCtx = createMockBatchCtx(batchEntities);
    mockStore.findBy.mockResolvedValue([]);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1'],
    );

    expect(result.size).toBe(0);
    // Verify DB query was made (avoid TypeORM internal fields)
    expect(mockStore.findBy).toHaveBeenCalledTimes(1);
    const callArgs = mockStore.findBy.mock.calls[0] as [
      typeof DataChanged,
      { id: { value: string[] } },
    ];
    expect(callArgs[0]).toBe(DataChanged);
    expect(callArgs[1].id.value).toEqual(['id-1']);
  });

  it('handles empty ids array (no DB query, returns batch entities only)', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      [], // Empty IDs
    );

    expect(result.size).toBe(1);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch' });
    expect(mockStore.findBy).not.toHaveBeenCalled();
  });

  it('does not query DB when all requested IDs are in batch', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch-1' })],
      ['id-2', new TestEntity({ id: 'id-2', value: 'batch-2' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1', 'id-2'],
    );

    expect(result.size).toBe(2);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch-1' });
    expect(result.get('id-2')).toEqual({ id: 'id-2', value: 'batch-2' });
    expect(mockStore.findBy).not.toHaveBeenCalled();
  });

  it('handles mixed batch and DB entities correctly', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntities = [
      new TestEntity({ id: 'id-2', value: 'db-2' }),
      new TestEntity({ id: 'id-3', value: 'db-3' }),
    ];
    mockStore.findBy.mockResolvedValue(dbEntities);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1', 'id-2', 'id-3'],
    );

    expect(result.size).toBe(3);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch' });
    expect(result.get('id-2')).toEqual({ id: 'id-2', value: 'db-2' });
    expect(result.get('id-3')).toEqual({ id: 'id-3', value: 'db-3' });
    // Verify DB query was made with correct IDs (avoid TypeORM internal fields)
    expect(mockStore.findBy).toHaveBeenCalledTimes(1);
    const callArgs = mockStore.findBy.mock.calls[0] as [
      typeof DataChanged,
      { id: { value: string[] } },
    ];
    expect(callArgs[0]).toBe(DataChanged);
    expect(callArgs[1].id.value).toEqual(['id-2', 'id-3']);
  });

  it('preserves batch entities not in requested IDs (intra-batch updates)', async () => {
    const batchEntities = new Map<string, TestEntity>([
      ['id-1', new TestEntity({ id: 'id-1', value: 'batch-1' })],
      ['id-2', new TestEntity({ id: 'id-2', value: 'batch-2' })],
      ['id-3', new TestEntity({ id: 'id-3', value: 'batch-3' })],
    ]);
    const batchCtx = createMockBatchCtx(batchEntities);
    const dbEntity = new TestEntity({ id: 'id-4', value: 'db-4' });
    mockStore.findBy.mockResolvedValue([dbEntity]);

    const result = await resolveEntities(
      mockStore as unknown as Store,
      batchCtx,
      'DataChanged' as keyof import('../entityRegistry').EntityRegistry,
      ['id-1', 'id-4'], // Only requesting id-1 and id-4
    );

    // Should get ALL 3 batch entities + 1 DB entity
    expect(result.size).toBe(4);
    expect(result.get('id-1')).toEqual({ id: 'id-1', value: 'batch-1' });
    expect(result.get('id-2')).toEqual({ id: 'id-2', value: 'batch-2' });
    expect(result.get('id-3')).toEqual({ id: 'id-3', value: 'batch-3' });
    expect(result.get('id-4')).toEqual({ id: 'id-4', value: 'db-4' });
  });
});
