/**
 * Unit tests for LSP3 Profile metadata fetch handler.
 *
 * Covers:
 * - META-01: LSP3 sub-entity creation from valid JSON (all 7 types)
 * - META-04: Head-only gating — no workerPool.fetchBatch when isHead=false
 * - META-05: Error tracking — failed fetches update entity error fields
 * - Empty value path: queueClear for all 7 sub-entity types when url is null
 */
import type { HandlerContext, StoredClearRequest } from '@/core/types';
import {
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
} from '@chillwhales/typeorm';
import { describe, expect, it, vi } from 'vitest';
import LSP3ProfileFetchHandler from '../lsp3ProfileFetch.handler';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  hasEntities: ReturnType<typeof vi.fn>;
  queueClear: ReturnType<typeof vi.fn>;
  queueDelete: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  setPersistHint: ReturnType<typeof vi.fn>;
  removeEntity: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
  _clearQueue: unknown[];
  _enrichmentQueue: unknown[];
} {
  const entityBags = new Map<string, Map<string, unknown>>();
  const clearQueue: unknown[] = [];
  const enrichmentQueue: unknown[] = [];

  return {
    getEntities: vi.fn(<T>(type: string): Map<string, T> => {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    }),
    addEntity: vi.fn((type: string, id: string, entity: unknown) => {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      entityBags.get(type)!.set(id, entity);
    }),
    hasEntities: vi.fn((type: string) => entityBags.has(type) && entityBags.get(type)!.size > 0),
    queueClear: vi.fn((request: unknown) => clearQueue.push(request)),
    queueDelete: vi.fn(),
    queueEnrichment: vi.fn((request: unknown) => enrichmentQueue.push(request)),
    setPersistHint: vi.fn(),
    removeEntity: vi.fn(),
    _entityBags: entityBags,
    _clearQueue: clearQueue,
    _enrichmentQueue: enrichmentQueue,
  };
}

// ---------------------------------------------------------------------------
// Mock HandlerContext helper
// ---------------------------------------------------------------------------
function createMockHandlerContext(
  batchCtx: ReturnType<typeof createMockBatchCtx>,
  overrides: { isHead?: boolean } = {},
): HandlerContext {
  return {
    store: {
      find: vi.fn(() => Promise.resolve([])),
      findBy: vi.fn(() => Promise.resolve([])),
    } as unknown as HandlerContext['store'],
    context: {
      log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as HandlerContext['context'],
    isHead: overrides.isHead ?? false,
    batchCtx: batchCtx as unknown as HandlerContext['batchCtx'],
    workerPool: {
      fetchBatch: vi.fn(() => Promise.resolve([])),
      shutdown: vi.fn(),
    } as unknown as HandlerContext['workerPool'],
  } as HandlerContext;
}

// ---------------------------------------------------------------------------
// Valid LSP3 profile JSON fixtures
// ---------------------------------------------------------------------------

const VALID_LSP3_JSON = {
  LSP3Profile: {
    name: 'Test Profile',
    description: 'A test profile description',
    tags: ['blockchain', 'lukso'],
    links: [
      { title: 'Website', url: 'https://example.com' },
      { title: 'Twitter', url: 'https://twitter.com/test' },
    ],
    avatar: [
      {
        url: 'ipfs://QmAvatar1',
        fileType: 'image/png',
        verification: { method: 'keccak256(bytes)', data: '0xabc' },
      },
    ],
    profileImage: [
      {
        url: 'ipfs://QmProfileImg1',
        width: 256,
        height: 256,
        verification: { method: 'keccak256(bytes)', data: '0xdef', source: 'ipfs://source1' },
      },
    ],
    backgroundImage: [
      {
        url: 'ipfs://QmBgImg1',
        width: 1024,
        height: 768,
        verification: { method: 'keccak256(bytes)', data: '0xghi' },
      },
    ],
  },
};

// ===========================================================================
// TESTS
// ===========================================================================

describe('LSP3ProfileFetchHandler - Empty value path', () => {
  it('queues clear for all 7 sub-entity types when url is null', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const entity = new LSP3Profile({ id: 'profile-1', url: null } as Partial<LSP3Profile>);
    batchCtx._entityBags.set('LSP3Profile', new Map([['profile-1', entity]]));

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    // Should queue 7 clear requests (one per sub-entity type)
    expect(batchCtx.queueClear).toHaveBeenCalledTimes(7);

    const expectedSubEntities = [
      LSP3ProfileName,
      LSP3ProfileDescription,
      LSP3ProfileTag,
      LSP3ProfileLink,
      LSP3ProfileAsset,
      LSP3ProfileImage,
      LSP3ProfileBackgroundImage,
    ];

    for (const subEntityClass of expectedSubEntities) {
      const clearCall = batchCtx._clearQueue.find(
        (req) => (req as StoredClearRequest).subEntityClass === subEntityClass,
      );
      expect(clearCall).toBeDefined();
      expect(clearCall).toMatchObject({
        fkField: 'lsp3Profile',
        parentIds: ['profile-1'],
      });
    }
  });

  it('runs empty value path even when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    const entity = new LSP3Profile({ id: 'profile-2', url: null } as Partial<LSP3Profile>);
    batchCtx._entityBags.set('LSP3Profile', new Map([['profile-2', entity]]));

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    expect(batchCtx.queueClear).toHaveBeenCalledTimes(7);
  });
});

describe('LSP3ProfileFetchHandler - Head-only gating (META-04)', () => {
  it('does NOT call workerPool.fetchBatch when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    // Seed an entity with a URL (non-null) — should NOT trigger fetch
    const entity = new LSP3Profile({
      id: 'profile-3',
      url: 'ipfs://QmTest123',
    } as Partial<LSP3Profile>);
    batchCtx._entityBags.set('LSP3Profile', new Map([['profile-3', entity]]));

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    expect(hctx.workerPool.fetchBatch).not.toHaveBeenCalled();
  });

  it('calls workerPool.fetchBatch when isHead is true and unfetched entities exist', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    // Mock store.find to return unfetched entities
    const unfetchedEntity = new LSP3Profile({
      id: 'profile-db-1',
      url: 'ipfs://QmDbProfile',
      isDataFetched: false,
    } as Partial<LSP3Profile>);
    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);

    // Mock fetchBatch to return results
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-db-1',
        entityType: 'LSP3Profile',
        success: true,
        data: VALID_LSP3_JSON,
      },
    ]);

    // Seed a URL entity in the bag
    const entity = new LSP3Profile({
      id: 'profile-3',
      url: 'ipfs://QmTest123',
    } as Partial<LSP3Profile>);
    batchCtx._entityBags.set('LSP3Profile', new Map([['profile-3', entity]]));

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    expect(hctx.workerPool.fetchBatch).toHaveBeenCalled();
  });
});

describe('LSP3ProfileFetchHandler - Successful fetch (META-01)', () => {
  it('creates all 7 sub-entity types from valid JSON', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-fetch-1',
      url: 'ipfs://QmFetch1',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);

    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-fetch-1',
        entityType: 'LSP3Profile',
        success: true,
        data: VALID_LSP3_JSON,
      },
    ]);

    const entity = new LSP3Profile({
      id: 'bag-entity',
      url: 'ipfs://QmBag',
    } as Partial<LSP3Profile>);
    batchCtx._entityBags.set('LSP3Profile', new Map([['bag-entity', entity]]));

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    // Verify all 7 sub-entity types were created
    const addedTypes = new Set<string>();
    for (const call of batchCtx.addEntity.mock.calls) {
      addedTypes.add(call[0] as string);
    }

    expect(addedTypes.has('LSP3ProfileName')).toBe(true);
    expect(addedTypes.has('LSP3ProfileDescription')).toBe(true);
    expect(addedTypes.has('LSP3ProfileTag')).toBe(true);
    expect(addedTypes.has('LSP3ProfileLink')).toBe(true);
    expect(addedTypes.has('LSP3ProfileAsset')).toBe(true);
    expect(addedTypes.has('LSP3ProfileImage')).toBe(true);
    expect(addedTypes.has('LSP3ProfileBackgroundImage')).toBe(true);
  });

  it('creates Name with correct value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-name-1',
      url: 'ipfs://QmName',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-name-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const nameCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileName',
    );
    expect(nameCalls.length).toBe(1);
    const nameEntity = nameCalls[0][2] as LSP3ProfileName;
    expect(nameEntity.value).toBe('Test Profile');
    expect(nameEntity.lsp3Profile).toBeDefined();
  });

  it('creates Description with correct value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-desc-1',
      url: 'ipfs://QmDesc',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-desc-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const descCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileDescription',
    );
    expect(descCalls.length).toBe(1);
    expect((descCalls[0][2] as LSP3ProfileDescription).value).toBe('A test profile description');
  });

  it('creates Tags with correct values', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-tags-1',
      url: 'ipfs://QmTags',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-tags-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const tagCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileTag',
    );
    expect(tagCalls.length).toBe(2);
    const tagValues = tagCalls.map((c: unknown[]) => (c[2] as LSP3ProfileTag).value);
    expect(tagValues).toContain('blockchain');
    expect(tagValues).toContain('lukso');
  });

  it('creates Links with correct title and url', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-links-1',
      url: 'ipfs://QmLinks',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-links-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const linkCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileLink',
    );
    expect(linkCalls.length).toBe(2);
    const links = linkCalls.map((c: unknown[]) => c[2] as LSP3ProfileLink);
    expect(links.find((l) => l.title === 'Website')?.url).toBe('https://example.com');
    expect(links.find((l) => l.title === 'Twitter')?.url).toBe('https://twitter.com/test');
  });

  it('creates Assets from avatar with file assets only', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-assets-1',
      url: 'ipfs://QmAssets',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-assets-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileAsset',
    );
    expect(assetCalls.length).toBe(1);
    const asset = assetCalls[0][2] as LSP3ProfileAsset;
    expect(asset.url).toBe('ipfs://QmAvatar1');
    expect(asset.fileType).toBe('image/png');
  });

  it('creates ProfileImages from flat array', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-imgs-1',
      url: 'ipfs://QmImgs',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-imgs-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const imgCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileImage',
    );
    expect(imgCalls.length).toBe(1);
    const img = imgCalls[0][2] as LSP3ProfileImage;
    expect(img.url).toBe('ipfs://QmProfileImg1');
    expect(img.width).toBe(256);
    expect(img.height).toBe(256);
  });

  it('creates BackgroundImages from flat array', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-bg-1',
      url: 'ipfs://QmBg',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-bg-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const bgCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3ProfileBackgroundImage',
    );
    expect(bgCalls.length).toBe(1);
    const bg = bgCalls[0][2] as LSP3ProfileBackgroundImage;
    expect(bg.url).toBe('ipfs://QmBgImg1');
    expect(bg.width).toBe(1024);
    expect(bg.height).toBe(768);
  });

  it('queues clear for sub-entities on successful fetch', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-clear-1',
      url: 'ipfs://QmClear',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'profile-clear-1', entityType: 'LSP3Profile', success: true, data: VALID_LSP3_JSON },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    // Should queue clear for all 7 sub-entity types
    expect(batchCtx.queueClear).toHaveBeenCalledTimes(7);
  });

  it('marks entity as isDataFetched=true on success', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-fetched-1',
      url: 'ipfs://QmFetched',
      isDataFetched: false,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-fetched-1',
        entityType: 'LSP3Profile',
        success: true,
        data: VALID_LSP3_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    // Find the addEntity call for LSP3Profile (the updated main entity)
    const profileCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3Profile',
    );
    expect(profileCalls.length).toBeGreaterThan(0);
    const updatedEntity = profileCalls[profileCalls.length - 1][2] as LSP3Profile;
    expect(updatedEntity.isDataFetched).toBe(true);
    expect(updatedEntity.fetchErrorMessage).toBeNull();
    expect(updatedEntity.fetchErrorCode).toBeNull();
    expect(updatedEntity.fetchErrorStatus).toBeNull();
  });
});

describe('LSP3ProfileFetchHandler - Failed fetch (META-05)', () => {
  it('updates entity with error fields on fetch failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-err-1',
      url: 'ipfs://QmError',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-err-1',
        entityType: 'LSP3Profile',
        success: false,
        error: 'IPFS timeout',
        errorCode: 'ETIMEDOUT',
        errorStatus: 504,
      },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const profileCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3Profile',
    );
    expect(profileCalls.length).toBe(1);
    const updatedEntity = profileCalls[0][2] as LSP3Profile;
    expect(updatedEntity.fetchErrorMessage).toBe('IPFS timeout');
    expect(updatedEntity.fetchErrorCode).toBe('ETIMEDOUT');
    expect(updatedEntity.fetchErrorStatus).toBe(504);
  });

  it('increments retryCount on failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-retry-1',
      url: 'ipfs://QmRetry',
      isDataFetched: false,
      retryCount: 2,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-retry-1',
        entityType: 'LSP3Profile',
        success: false,
        error: 'Server error',
        errorCode: null,
        errorStatus: 500,
      },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const profileCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3Profile',
    );
    const updatedEntity = profileCalls[0][2] as LSP3Profile;
    expect(updatedEntity.retryCount).toBe(3);
  });

  it('updates entity with parse error on invalid JSON shape', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetchedEntity = new LSP3Profile({
      id: 'profile-parse-err-1',
      url: 'ipfs://QmParseErr',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP3Profile>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetchedEntity]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'profile-parse-err-1',
        entityType: 'LSP3Profile',
        success: true,
        data: { SomeOtherKey: {} }, // Missing LSP3Profile key
      },
    ]);

    batchCtx._entityBags.set('LSP3Profile', new Map());

    await LSP3ProfileFetchHandler.handle(hctx, 'LSP3Profile');

    const profileCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP3Profile',
    );
    expect(profileCalls.length).toBe(1);
    const updatedEntity = profileCalls[0][2] as LSP3Profile;
    expect(updatedEntity.fetchErrorMessage).toBe('Error: Invalid LSP3Profile');
    expect(updatedEntity.retryCount).toBe(1);
  });
});
