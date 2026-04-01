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
import { OrbCooldownExpiry, OrbLevel, TokenIdDataChanged } from '@/model';
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
/**
 * Simulate how TypeORM actually returns entities from store.findOneBy().
 *
 * When TypeORM hydrates an entity from the database, relation properties
 * (ManyToOne, OneToOne) are NOT set on the instance unless explicitly
 * loaded via `relations: [...]`. The entity only has its column fields.
 *
 * This is critical because the OrbLevel constructor uses Object.assign(this, props),
 * so only properties present on the `props` object become own properties on the
 * instance. If `digitalAsset` and `nft` aren't in `props`, they won't be
 * own properties — even though the class declares them with `!`.
 *
 * TypeScript's `!` (definite assignment assertion) is compile-time only.
 * It does NOT generate any runtime code to create the property.
 */
function simulateDbLoadedEntity<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EntityClass: new (props?: any) => T,
  columnValues: Record<string, unknown>,
): T {
  // TypeORM hydration: only column values, no relation properties
  return new EntityClass(columnValues);
}

describe('OrbLevel handler - Cross-batch FK preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('entity created with explicit FK: null has FK as own property (enrichment works)', () => {
    // When the mint path creates an entity with explicit FK fields
    const withExplicitNull = new OrbLevel({
      id: 'test',
      address: ORBS_ADDRESS,
      tokenId: '0x01',
      value: 0,
      digitalAsset: null,
      nft: null,
    });

    // These should be own properties because Object.assign set them
    expect('digitalAsset' in withExplicitNull).toBe(true);
    expect('nft' in withExplicitNull).toBe(true);
  });

  it('DB-loaded entity without relation properties: FK NOT own property (enrichment skipped)', () => {
    // Simulate how TypeORM returns entities from findOneBy WITHOUT relations
    const dbLoaded = simulateDbLoadedEntity(OrbLevel, {
      id: 'test',
      address: ORBS_ADDRESS,
      tokenId: '0x01',
      value: 0,
      blockNumber: 100,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date(),
      // NO digitalAsset or nft — TypeORM doesn't set relations unless loaded
    });

    // These should NOT be own properties — TypeORM didn't set them
    expect('digitalAsset' in dbLoaded).toBe(false);
    expect('nft' in dbLoaded).toBe(false);
  });

  it('spreading DB-loaded entity does NOT create FK properties on new instance', () => {
    // Simulate DB load without relations
    const dbLoaded = simulateDbLoadedEntity(OrbLevel, {
      id: 'test',
      address: ORBS_ADDRESS,
      tokenId: '0x01',
      value: 0,
      blockNumber: 100,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date(),
    });

    // Spread into new entity (what the handler does)
    const respread = new OrbLevel({
      ...dbLoaded,
      value: 5, // Update the level
    });

    // FK fields should STILL be missing — spread can't copy what doesn't exist
    expect('digitalAsset' in respread).toBe(false);
    expect('nft' in respread).toBe(false);
  });

  it('explicit ?? null after spread DOES create FK properties on new instance', () => {
    // Simulate DB load without relations
    const dbLoaded = simulateDbLoadedEntity(OrbLevel, {
      id: 'test',
      address: ORBS_ADDRESS,
      tokenId: '0x01',
      value: 0,
      blockNumber: 100,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date(),
    });

    // Spread + explicit FK null (the fix)
    const withFix = new OrbLevel({
      ...dbLoaded,
      value: 5,
      digitalAsset: dbLoaded.digitalAsset ?? null,
      nft: dbLoaded.nft ?? null,
    });

    // FK fields should now exist as own properties
    expect('digitalAsset' in withFix).toBe(true);
    expect('nft' in withFix).toBe(true);
  });

  it('handler output has FK fields when DB entity was loaded WITHOUT relations (the actual bug)', async () => {
    // THIS IS THE BUG: TypeORM returns entities from findOneBy without
    // relation properties. The handler spreads this entity, but the spread
    // can't copy properties that don't exist. The resulting entity added to
    // BatchContext lacks digitalAsset/nft, causing the enrichment pipeline's
    // `if (!(request.fkField in entity))` check to skip FK assignment.
    const tokenId = '0x01';
    const id = generateTokenId({ address: ORBS_ADDRESS, tokenId });

    // Simulate DB-loaded entity WITHOUT relation properties (realistic)
    const dbLevel = simulateDbLoadedEntity(OrbLevel, {
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      blockNumber: 1000000,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date('2024-01-01T00:00:00Z'),
    });

    const dbCooldown = simulateDbLoadedEntity(OrbCooldownExpiry, {
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      blockNumber: 1000000,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: new Date('2024-01-01T00:00:00Z'),
    });

    const store = createMockStore([dbLevel], [dbCooldown]);
    const batchCtx = createMockBatchCtx();

    const event = new TokenIdDataChanged({
      id: 'event-1',
      timestamp: new Date('2024-01-02T00:00:00Z'),
      blockNumber: 2000000,
      logIndex: 0,
      transactionIndex: 0,
      address: ORBS_ADDRESS,
      tokenId,
      dataKey: ORB_LEVEL_KEY,
      dataValue: '0x0000000500000064', // level=5, cooldown=100
    });

    batchCtx._entityBags.set('TokenIdDataChanged', new Map([[event.id, event]]));

    const hctx = createMockHandlerContext(batchCtx, store);

    // Act
    await OrbLevelHandler.handle(hctx, 'TokenIdDataChanged');

    // Assert: The entity added to BatchContext must have FK fields as own properties
    // so the enrichment pipeline's `'digitalAsset' in entity` check passes.
    const addedLevel = batchCtx._entityBags.get('OrbLevel')?.get(id) as OrbLevel;
    expect(addedLevel).toBeDefined();
    expect(addedLevel.value).toBe(5);

    // THIS IS THE KEY ASSERTION: does the output entity have FK fields?
    expect('digitalAsset' in addedLevel).toBe(true);
    expect('nft' in addedLevel).toBe(true);

    const addedCooldown = batchCtx._entityBags
      .get('OrbCooldownExpiry')
      ?.get(id) as OrbCooldownExpiry;
    expect(addedCooldown).toBeDefined();
    expect(addedCooldown.value).toBe(100);
    expect('digitalAsset' in addedCooldown).toBe(true);
    expect('nft' in addedCooldown).toBe(true);
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
      digitalAsset: null, // FK populated by enrichment
      nft: null, // FK populated by enrichment
    });

    const existingCooldown = new OrbCooldownExpiry({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      digitalAsset: null,
      nft: null,
    });

    const store = createMockStore([existingLevel], [existingCooldown]);
    const batchCtx = createMockBatchCtx();

    // TokenIdDataChanged event with packed level + cooldown
    const event = new TokenIdDataChanged({
      id: 'event-1',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      blockNumber: 2000000,
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
        digitalAsset: null, // Preserved from DB
        nft: null, // Preserved from DB
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
      digitalAsset: null,
      nft: null,
    });

    const dbCooldown = new OrbCooldownExpiry({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 10,
      digitalAsset: null,
      nft: null,
    });

    const store = createMockStore([dbLevel], [dbCooldown]);
    const batchCtx = createMockBatchCtx();

    // Entity also in batch with updated FKs (from enrichment in same batch)
    const batchLevel = new OrbLevel({
      id,
      address: ORBS_ADDRESS,
      tokenId,
      value: 0,
      digitalAsset: null, // Updated in current batch
      nft: null,
    });

    batchCtx._entityBags.set('OrbLevel', new Map([[id, batchLevel]]));

    const event = new TokenIdDataChanged({
      id: 'event-3',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      blockNumber: 2000000,
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
        digitalAsset: null, // From batch, not DB
        nft: null, // From batch, not DB
      }),
    );
  });
});
