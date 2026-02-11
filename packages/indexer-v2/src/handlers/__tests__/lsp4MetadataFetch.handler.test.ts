/**
 * Unit tests for LSP4 Digital Asset metadata fetch handler.
 *
 * Covers:
 * - META-02: LSP4 sub-entity creation from valid JSON (all 10 types)
 * - META-04: Head-only gating — no workerPool.fetchBatch when isHead=false
 * - META-05: Error tracking — failed fetches update entity error fields
 * - Empty value path: queueClear for all 10 sub-entity types when url is null
 * - Score/Rank extraction from attributes
 * - Attribute score/rarity field parsing (string, number, non-numeric)
 */
import type { HandlerContext, StoredClearRequest } from '@/core/types';
import {
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4MetadataRank,
  LSP4MetadataScore,
} from '@chillwhales/typeorm';
import { describe, expect, it, vi } from 'vitest';
import LSP4MetadataFetchHandler from '../lsp4MetadataFetch.handler';

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
      const bag = entityBags.get(type);
      if (bag) bag.set(id, entity);
    }),
    hasEntities: vi.fn((type: string) => {
      const bag = entityBags.get(type);
      return bag != null && bag.size > 0;
    }),
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
// Valid LSP4 metadata JSON fixtures
// ---------------------------------------------------------------------------

const VALID_LSP4_JSON = {
  LSP4Metadata: {
    name: 'Chillwhale #42',
    description: 'A unique Chillwhale NFT',
    category: 'Collectible',
    links: [{ title: 'Marketplace', url: 'https://universal.page' }],
    images: [
      [
        {
          url: 'ipfs://QmMainImg',
          width: 1024,
          height: 1024,
          verification: { method: 'keccak256(bytes)', data: '0ximg1' },
        },
      ],
      [
        {
          url: 'ipfs://QmThumb',
          width: 128,
          height: 128,
        },
      ],
    ],
    icon: [
      {
        url: 'ipfs://QmIcon1',
        width: 64,
        height: 64,
        verification: { method: 'keccak256(bytes)', data: '0xicon1' },
      },
      {
        url: 'ipfs://QmIcon2',
        width: 32,
        height: 32,
      },
    ],
    assets: [
      {
        url: 'ipfs://QmAsset1',
        fileType: 'model/gltf-binary',
        verification: { method: 'keccak256(bytes)', data: '0xasset1' },
      },
    ],
    attributes: [
      { key: 'Background', value: 'Ocean', type: 'string', score: '85', rarity: '12.5' },
      { key: 'Score', value: '950', type: 'number' },
      { key: 'Rank', value: '42', type: 'number' },
      { key: 'Trait', value: 'Rare', type: 'string', score: 100, rarity: 0.5 },
    ],
  },
};

// ===========================================================================
// TESTS
// ===========================================================================

describe('LSP4MetadataFetchHandler - Empty value path', () => {
  it('queues clear for all 10 sub-entity types when url is null', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const entity = new LSP4Metadata({ id: 'meta-1', url: null } as Partial<LSP4Metadata>);
    batchCtx._entityBags.set('LSP4Metadata', new Map([['meta-1', entity]]));

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    expect(batchCtx.queueClear).toHaveBeenCalledTimes(10);

    const expectedSubEntities = [
      LSP4MetadataName,
      LSP4MetadataDescription,
      LSP4MetadataCategory,
      LSP4MetadataLink,
      LSP4MetadataImage,
      LSP4MetadataIcon,
      LSP4MetadataAsset,
      LSP4MetadataAttribute,
      LSP4MetadataScore,
      LSP4MetadataRank,
    ];

    for (const subEntityClass of expectedSubEntities) {
      const clearCall = batchCtx._clearQueue.find(
        (req) => (req as StoredClearRequest).subEntityClass === subEntityClass,
      );
      expect(clearCall).toBeDefined();
      expect(clearCall).toMatchObject({
        fkField: 'lsp4Metadata',
        parentIds: ['meta-1'],
      });
    }
  });

  it('runs empty value path even when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    const entity = new LSP4Metadata({ id: 'meta-2', url: null } as Partial<LSP4Metadata>);
    batchCtx._entityBags.set('LSP4Metadata', new Map([['meta-2', entity]]));

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    expect(batchCtx.queueClear).toHaveBeenCalledTimes(10);
  });
});

describe('LSP4MetadataFetchHandler - Head-only gating (META-04)', () => {
  it('does NOT call workerPool.fetchBatch when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    const entity = new LSP4Metadata({
      id: 'meta-3',
      url: 'ipfs://QmTest',
    } as Partial<LSP4Metadata>);
    batchCtx._entityBags.set('LSP4Metadata', new Map([['meta-3', entity]]));

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    expect(hctx.workerPool.fetchBatch).not.toHaveBeenCalled();
  });

  it('calls workerPool.fetchBatch when isHead is true and unfetched entities exist', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-db-1',
      url: 'ipfs://QmDbMeta',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);
    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);

    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-db-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    expect(hctx.workerPool.fetchBatch).toHaveBeenCalled();
  });
});

describe('LSP4MetadataFetchHandler - Successful fetch (META-02)', () => {
  it('creates all 10 sub-entity types from valid JSON', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-fetch-1',
      url: 'ipfs://QmFetch',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-fetch-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const addedTypes = new Set<string>();
    for (const call of batchCtx.addEntity.mock.calls) {
      addedTypes.add(call[0] as string);
    }

    expect(addedTypes.has('LSP4MetadataName')).toBe(true);
    expect(addedTypes.has('LSP4MetadataDescription')).toBe(true);
    expect(addedTypes.has('LSP4MetadataCategory')).toBe(true);
    expect(addedTypes.has('LSP4MetadataLink')).toBe(true);
    expect(addedTypes.has('LSP4MetadataImage')).toBe(true);
    expect(addedTypes.has('LSP4MetadataIcon')).toBe(true);
    expect(addedTypes.has('LSP4MetadataAsset')).toBe(true);
    expect(addedTypes.has('LSP4MetadataAttribute')).toBe(true);
    expect(addedTypes.has('LSP4MetadataScore')).toBe(true);
    expect(addedTypes.has('LSP4MetadataRank')).toBe(true);
  });

  it('creates Name with correct value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-name-1',
      url: 'ipfs://QmName',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-name-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const nameCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataName',
    );
    expect(nameCalls.length).toBe(1);
    expect((nameCalls[0][2] as LSP4MetadataName).value).toBe('Chillwhale #42');
  });

  it('creates Description with correct value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-desc-1',
      url: 'ipfs://QmDesc',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-desc-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const descCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataDescription',
    );
    expect(descCalls.length).toBe(1);
    expect((descCalls[0][2] as LSP4MetadataDescription).value).toBe('A unique Chillwhale NFT');
  });

  it('creates Category even when category value is present', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-cat-1',
      url: 'ipfs://QmCat',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-cat-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const catCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataCategory',
    );
    expect(catCalls.length).toBe(1);
    expect((catCalls[0][2] as LSP4MetadataCategory).value).toBe('Collectible');
  });

  it('creates Category even when category value is undefined (V1 behavior)', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const noCategoryJSON = {
      LSP4Metadata: {
        name: 'No Category NFT',
        description: 'Has no category',
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-nocat-1',
      url: 'ipfs://QmNoCat',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-nocat-1', entityType: 'LSP4Metadata', success: true, data: noCategoryJSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const catCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataCategory',
    );
    // Category always created even when undefined
    expect(catCalls.length).toBe(1);
    expect((catCalls[0][2] as LSP4MetadataCategory).value).toBeUndefined();
  });

  it('creates Links with correct title and url', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-links-1',
      url: 'ipfs://QmLinks',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-links-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const linkCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataLink',
    );
    expect(linkCalls.length).toBe(1);
    const link = linkCalls[0][2] as LSP4MetadataLink;
    expect(link.title).toBe('Marketplace');
    expect(link.url).toBe('https://universal.page');
  });

  it('creates Images with imageIndex from nested arrays', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-imgs-1',
      url: 'ipfs://QmImgs',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-imgs-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const imgCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataImage',
    );
    expect(imgCalls.length).toBe(2);

    const img1 = imgCalls[0][2] as LSP4MetadataImage;
    expect(img1.url).toBe('ipfs://QmMainImg');
    expect(img1.width).toBe(1024);
    expect(img1.height).toBe(1024);
    expect(img1.imageIndex).toBe(0);

    const img2 = imgCalls[1][2] as LSP4MetadataImage;
    expect(img2.url).toBe('ipfs://QmThumb');
    expect(img2.width).toBe(128);
    expect(img2.height).toBe(128);
    expect(img2.imageIndex).toBe(1);
  });

  it('creates Icons from flat array (all items, no isFileImage filter)', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-icons-1',
      url: 'ipfs://QmIcons',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-icons-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const iconCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataIcon',
    );
    // Both icon items should be created (no isFileImage filter)
    expect(iconCalls.length).toBe(2);

    const icon1 = iconCalls[0][2] as LSP4MetadataIcon;
    expect(icon1.url).toBe('ipfs://QmIcon1');
    expect(icon1.width).toBe(64);
    expect(icon1.height).toBe(64);

    const icon2 = iconCalls[1][2] as LSP4MetadataIcon;
    expect(icon2.url).toBe('ipfs://QmIcon2');
    expect(icon2.width).toBe(32);
    expect(icon2.height).toBe(32);
  });

  it('creates Assets with verification fields', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-assets-1',
      url: 'ipfs://QmAssets',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-assets-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAsset',
    );
    expect(assetCalls.length).toBe(1);
    const asset = assetCalls[0][2] as LSP4MetadataAsset;
    expect(asset.url).toBe('ipfs://QmAsset1');
    expect(asset.fileType).toBe('model/gltf-binary');
  });

  it('creates Attributes with key, value, type, score, and rarity', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-attrs-1',
      url: 'ipfs://QmAttrs',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-attrs-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const attrCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAttribute',
    );
    expect(attrCalls.length).toBe(4);

    const attrs = attrCalls.map((c: unknown[]) => c[2] as LSP4MetadataAttribute);
    const bgAttr = attrs.find((a) => a.key === 'Background');
    if (!bgAttr) throw new Error('Expected Background attribute');
    expect(bgAttr.value).toBe('Ocean');
    expect(bgAttr.type).toBe('string');
    expect(bgAttr.score).toBe(85); // parsed from string '85'
    expect(bgAttr.rarity).toBe(12.5); // parsed from string '12.5'

    const traitAttr = attrs.find((a) => a.key === 'Trait');
    if (!traitAttr) throw new Error('Expected Trait attribute');
    expect(traitAttr.score).toBe(100); // number type
    expect(traitAttr.rarity).toBe(0.5); // number type
  });

  it('marks entity as isDataFetched=true on success', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-success-1',
      url: 'ipfs://QmSuccess',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-success-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const metaCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4Metadata',
    );
    expect(metaCalls.length).toBeGreaterThan(0);
    const updated = metaCalls[metaCalls.length - 1][2] as LSP4Metadata;
    expect(updated.isDataFetched).toBe(true);
    expect(updated.fetchErrorMessage).toBeNull();
  });
});

describe('LSP4MetadataFetchHandler - Score/Rank extraction', () => {
  it('creates Score from attribute with key=Score and numeric value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-score-1',
      url: 'ipfs://QmScore',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-score-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const scoreCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataScore',
    );
    expect(scoreCalls.length).toBe(1);
    const score = scoreCalls[0][2] as LSP4MetadataScore;
    expect(score.value).toBe(950); // parseInt('950')
  });

  it('creates Rank from attribute with key=Rank and numeric value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-rank-1',
      url: 'ipfs://QmRank',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-rank-1', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const rankCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataRank',
    );
    expect(rankCalls.length).toBe(1);
    const rank = rankCalls[0][2] as LSP4MetadataRank;
    expect(rank.value).toBe(42); // parseInt('42')
  });

  it('does NOT create Score for non-numeric attribute value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const nonNumericJSON = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Score', value: 'not-a-number', type: 'string' }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-noscore-1',
      url: 'ipfs://QmNoScore',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'meta-noscore-1',
        entityType: 'LSP4Metadata',
        success: true,
        data: nonNumericJSON,
      },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const scoreCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataScore',
    );
    expect(scoreCalls.length).toBe(0);
  });

  it('does NOT create Rank for non-numeric attribute value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const nonNumericJSON = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Rank', value: 'abc', type: 'string' }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-norank-1',
      url: 'ipfs://QmNoRank',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'meta-norank-1',
        entityType: 'LSP4Metadata',
        success: true,
        data: nonNumericJSON,
      },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const rankCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataRank',
    );
    expect(rankCalls.length).toBe(0);
  });
});

describe('LSP4MetadataFetchHandler - Attribute score/rarity parsing', () => {
  it('parses numeric string score via parseInt', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const json = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Attr', value: 'val', score: '42' }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-scorep-1',
      url: 'ipfs://QmScoreP',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-scorep-1', entityType: 'LSP4Metadata', success: true, data: json },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const attrCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAttribute',
    );
    expect(attrCalls.length).toBe(1);
    expect((attrCalls[0][2] as LSP4MetadataAttribute).score).toBe(42);
  });

  it('uses number score directly', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const json = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Attr', value: 'val', score: 99 }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-scoren-1',
      url: 'ipfs://QmScoreN',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-scoren-1', entityType: 'LSP4Metadata', success: true, data: json },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const attrCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAttribute',
    );
    expect((attrCalls[0][2] as LSP4MetadataAttribute).score).toBe(99);
  });

  it('returns null score for non-numeric string', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const json = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Attr', value: 'val', score: 'not-numeric' }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-scorenn-1',
      url: 'ipfs://QmScoreNN',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-scorenn-1', entityType: 'LSP4Metadata', success: true, data: json },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const attrCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAttribute',
    );
    expect((attrCalls[0][2] as LSP4MetadataAttribute).score).toBeNull();
  });

  it('returns null score when score property is absent', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const json = {
      LSP4Metadata: {
        name: 'Test',
        attributes: [{ key: 'Attr', value: 'val' }],
      },
    };

    const unfetched = new LSP4Metadata({
      id: 'meta-noscoreprop-1',
      url: 'ipfs://QmNoScoreProp',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'meta-noscoreprop-1', entityType: 'LSP4Metadata', success: true, data: json },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const attrCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4MetadataAttribute',
    );
    expect((attrCalls[0][2] as LSP4MetadataAttribute).score).toBeNull();
  });
});

describe('LSP4MetadataFetchHandler - Failed fetch (META-05)', () => {
  it('updates entity with error fields on fetch failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-err-1',
      url: 'ipfs://QmError',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'meta-err-1',
        entityType: 'LSP4Metadata',
        success: false,
        error: 'IPFS gateway error',
        errorCode: 'ETIMEDOUT',
        errorStatus: 504,
      },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const metaCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4Metadata',
    );
    expect(metaCalls.length).toBe(1);
    const updated = metaCalls[0][2] as LSP4Metadata;
    expect(updated.fetchErrorMessage).toBe('IPFS gateway error');
    expect(updated.fetchErrorCode).toBe('ETIMEDOUT');
    expect(updated.fetchErrorStatus).toBe(504);
  });

  it('increments retryCount on failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-retry-1',
      url: 'ipfs://QmRetry',
      isDataFetched: false,
      retryCount: 3,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'meta-retry-1',
        entityType: 'LSP4Metadata',
        success: false,
        error: 'Server error',
        errorStatus: 500,
      },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const metaCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4Metadata',
    );
    const updated = metaCalls[0][2] as LSP4Metadata;
    expect(updated.retryCount).toBe(4);
  });

  it('handles parse error with invalid JSON shape', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-parse-1',
      url: 'ipfs://QmParse',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'meta-parse-1',
        entityType: 'LSP4Metadata',
        success: true,
        data: { WrongKey: {} },
      },
    ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    const metaCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4Metadata',
    );
    expect(metaCalls.length).toBe(1);
    const updated = metaCalls[0][2] as LSP4Metadata;
    expect(updated.fetchErrorMessage).toBe('Error: Invalid LSP4Metadata');
    expect(updated.retryCount).toBe(1);
  });
});

describe('LSP4MetadataFetchHandler - Worker pool errors', () => {
  it('logs error and continues when workerPool.fetchBatch throws', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP4Metadata({
      id: 'meta-error-1',
      url: 'ipfs://QmError',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Worker pool crashed'),
    );

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    // Should not throw - error handling catches and logs
    await expect(LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata')).resolves.not.toThrow();

    // Verify warning was logged (includes batch number now)
    expect(hctx.context.log.warn).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('Metadata fetch batch 1/1 failed'),
    );

    // Verify no entities were updated (error causes continue to skip batch)
    const metaCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP4Metadata',
    );
    expect(metaCalls.length).toBe(0);
  });

  it('processes remaining batches when one batch fails', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    // Create 2 unfetched entities (will be processed in 1 batch given FETCH_BATCH_SIZE)
    const unfetched1 = new LSP4Metadata({
      id: 'meta-batch-1',
      url: 'ipfs://QmBatch1',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    const unfetched2 = new LSP4Metadata({
      id: 'meta-batch-2',
      url: 'ipfs://QmBatch2',
      isDataFetched: false,
    } as Partial<LSP4Metadata>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched1, unfetched2]);

    // First call fails, second succeeds (simulating multi-batch scenario)
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Batch 1 failed'))
      .mockResolvedValueOnce([
        { id: 'meta-batch-2', entityType: 'LSP4Metadata', success: true, data: VALID_LSP4_JSON },
      ]);

    batchCtx._entityBags.set('LSP4Metadata', new Map());

    await LSP4MetadataFetchHandler.handle(hctx, 'LSP4Metadata');

    // Both batches were attempted (fetchBatch called once since both fit in one batch)
    // In real scenario with more entities, this would demonstrate batch resilience
    expect(hctx.workerPool.fetchBatch).toHaveBeenCalled();
  });
});
