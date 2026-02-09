/**
 * Unit tests for LSP29 Encrypted Asset metadata fetch handler.
 *
 * Covers:
 * - META-03: LSP29 sub-entity creation from valid JSON (all 7 types)
 * - META-04: Head-only gating — no workerPool.fetchBatch when isHead=false
 * - META-05: Error tracking — failed fetches update entity error fields
 * - Empty value path: queueClear for all 6 sub-entity types when url is null
 * - entityUpdates: version, contentId, revision, createdAt returned on success
 * - FK chain: AccessControlCondition links to Encryption, not Asset
 */
import type { HandlerContext, StoredClearRequest } from '@/core/types';
import {
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetTitle,
} from '@chillwhales/typeorm';
import { describe, expect, it, vi } from 'vitest';
import LSP29EncryptedAssetFetchHandler from '../lsp29EncryptedAssetFetch.handler';

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
// Valid LSP29 encrypted asset JSON fixture
// ---------------------------------------------------------------------------

const VALID_LSP29_JSON = {
  LSP29EncryptedAsset: {
    version: '1.0.0',
    id: 'content-id-123',
    title: 'Encrypted Art #1',
    description: 'A beautiful encrypted artwork',
    revision: 3,
    createdAt: '2024-06-15T12:00:00Z',
    file: {
      type: 'video/mp4',
      name: 'artwork.mp4',
      size: 1048576,
      lastModified: 1718449200000,
      hash: '0xabc123def456',
    },
    encryption: {
      method: 'lit-protocol',
      ciphertext: 'encrypted-data-blob',
      dataToEncryptHash: '0xhash123',
      decryptionCode: 'code-456',
      decryptionParams: { chain: 'lukso', version: 2 },
      accessControlConditions: [
        {
          contractAddress: '0xDA1111111111111111111111111111111111111111',
          chain: 'lukso',
          method: 'balanceOf',
          standardContractType: 'LSP7',
          comparator: '>',
          returnValueTest: { comparator: '>', value: '0' },
          parameters: ['0x' + 'aa'.repeat(33)],
        },
        {
          contractAddress: '0xDA2222222222222222222222222222222222222222',
          chain: 'lukso',
          method: 'isFollowing',
          parameters: ['0xfollower123'],
        },
      ],
    },
    chunks: {
      cids: ['QmChunk1', 'QmChunk2', 'QmChunk3'],
      iv: 'iv-random-bytes',
      totalSize: 3145728,
    },
    images: [
      [
        {
          url: 'ipfs://QmImg1',
          width: 512,
          height: 512,
          verification: { method: 'keccak256(bytes)', data: '0ximg1hash' },
        },
      ],
      [
        {
          url: 'ipfs://QmImg2',
          width: 128,
          height: 128,
        },
      ],
    ],
  },
};

// ===========================================================================
// TESTS
// ===========================================================================

describe('LSP29EncryptedAssetFetchHandler - Empty value path', () => {
  it('queues clear for all 6 sub-entity types when url is null', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx);

    const entity = new LSP29EncryptedAsset({
      id: 'asset-1',
      url: null,
    } as Partial<LSP29EncryptedAsset>);
    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map([['asset-1', entity]]));

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    // 6 sub-entity types in descriptors (AccessControlCondition excluded)
    expect(batchCtx.queueClear).toHaveBeenCalledTimes(6);

    const expectedSubEntities = [
      LSP29EncryptedAssetTitle,
      LSP29EncryptedAssetDescription,
      LSP29EncryptedAssetFile,
      LSP29EncryptedAssetEncryption,
      LSP29EncryptedAssetChunks,
      LSP29EncryptedAssetImage,
    ];

    for (const subEntityClass of expectedSubEntities) {
      const clearCall = batchCtx._clearQueue.find(
        (req) => (req as StoredClearRequest).subEntityClass === subEntityClass,
      );
      expect(clearCall).toBeDefined();
      expect(clearCall).toMatchObject({
        fkField: 'lsp29EncryptedAsset',
        parentIds: ['asset-1'],
      });
    }
  });

  it('runs empty value path even when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    const entity = new LSP29EncryptedAsset({
      id: 'asset-2',
      url: null,
    } as Partial<LSP29EncryptedAsset>);
    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map([['asset-2', entity]]));

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    expect(batchCtx.queueClear).toHaveBeenCalledTimes(6);
  });
});

describe('LSP29EncryptedAssetFetchHandler - Head-only gating (META-04)', () => {
  it('does NOT call workerPool.fetchBatch when isHead is false', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: false });

    const entity = new LSP29EncryptedAsset({
      id: 'asset-3',
      url: 'ipfs://QmTest',
    } as Partial<LSP29EncryptedAsset>);
    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map([['asset-3', entity]]));

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    expect(hctx.workerPool.fetchBatch).not.toHaveBeenCalled();
  });

  it('calls workerPool.fetchBatch when isHead is true and unfetched entities exist', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-db-1',
      url: 'ipfs://QmDbAsset',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);
    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);

    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-db-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    expect(hctx.workerPool.fetchBatch).toHaveBeenCalled();
  });
});

describe('LSP29EncryptedAssetFetchHandler - Successful fetch (META-03)', () => {
  it('creates all 7 sub-entity types from valid JSON', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-fetch-1',
      url: 'ipfs://QmFetch',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-fetch-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const addedTypes = new Set<string>();
    for (const call of batchCtx.addEntity.mock.calls) {
      addedTypes.add(call[0] as string);
    }

    expect(addedTypes.has('LSP29EncryptedAssetTitle')).toBe(true);
    expect(addedTypes.has('LSP29EncryptedAssetDescription')).toBe(true);
    expect(addedTypes.has('LSP29EncryptedAssetFile')).toBe(true);
    expect(addedTypes.has('LSP29EncryptedAssetEncryption')).toBe(true);
    expect(addedTypes.has('LSP29AccessControlCondition')).toBe(true);
    expect(addedTypes.has('LSP29EncryptedAssetChunks')).toBe(true);
    expect(addedTypes.has('LSP29EncryptedAssetImage')).toBe(true);
  });

  it('creates Title with correct value', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-title-1',
      url: 'ipfs://QmTitle',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-title-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const titleCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetTitle',
    );
    expect(titleCalls.length).toBe(1);
    const title = titleCalls[0][2] as LSP29EncryptedAssetTitle;
    expect(title.value).toBe('Encrypted Art #1');
    expect(title.lsp29EncryptedAsset).toBeDefined();
  });

  it('creates File with BigInt size and lastModified', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-file-1',
      url: 'ipfs://QmFile',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-file-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const fileCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetFile',
    );
    expect(fileCalls.length).toBe(1);
    const file = fileCalls[0][2] as LSP29EncryptedAssetFile;
    expect(file.type).toBe('video/mp4');
    expect(file.name).toBe('artwork.mp4');
    expect(file.size).toBe(BigInt(1048576));
    expect(file.lastModified).toBe(BigInt(1718449200000));
    expect(file.hash).toBe('0xabc123def456');
  });

  it('creates Encryption with stringified decryptionParams', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-enc-1',
      url: 'ipfs://QmEnc',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-enc-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const encCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetEncryption',
    );
    expect(encCalls.length).toBe(1);
    const enc = encCalls[0][2] as LSP29EncryptedAssetEncryption;
    expect(enc.method).toBe('lit-protocol');
    expect(enc.ciphertext).toBe('encrypted-data-blob');
    expect(enc.dataToEncryptHash).toBe('0xhash123');
    expect(enc.decryptionCode).toBe('code-456');
    expect(enc.decryptionParams).toBe(JSON.stringify({ chain: 'lukso', version: 2 }));
  });

  it('creates AccessControlConditions linked to Encryption (not Asset)', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-acc-1',
      url: 'ipfs://QmAcc',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-acc-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const condCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29AccessControlCondition',
    );
    expect(condCalls.length).toBe(2);

    // Verify FK is encryption, not lsp29EncryptedAsset
    const cond1 = condCalls[0][2] as LSP29AccessControlCondition;
    expect(cond1.encryption).toBeDefined();
    expect(cond1.encryption).not.toBeNull();
    expect(cond1.conditionIndex).toBe(0);
    expect(cond1.contractAddress).toBe('0xDA1111111111111111111111111111111111111111');
    expect(cond1.chain).toBe('lukso');
    expect(cond1.method).toBe('balanceOf');
    expect(cond1.standardContractType).toBe('LSP7');

    const cond2 = condCalls[1][2] as LSP29AccessControlCondition;
    expect(cond2.conditionIndex).toBe(1);
    expect(cond2.method).toBe('isFollowing');
    expect(cond2.followerAddress).toBe('0xfollower123');
  });

  it('creates Chunks with BigInt totalSize', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-chunks-1',
      url: 'ipfs://QmChunks',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-chunks-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const chunksCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetChunks',
    );
    expect(chunksCalls.length).toBe(1);
    const chunks = chunksCalls[0][2] as LSP29EncryptedAssetChunks;
    expect(chunks.cids).toEqual(['QmChunk1', 'QmChunk2', 'QmChunk3']);
    expect(chunks.iv).toBe('iv-random-bytes');
    expect(chunks.totalSize).toBe(BigInt(3145728));
  });

  it('creates Images with imageIndex', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-imgs-1',
      url: 'ipfs://QmImgs',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-imgs-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const imgCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAssetImage',
    );
    expect(imgCalls.length).toBe(2);

    const img1 = imgCalls[0][2] as LSP29EncryptedAssetImage;
    expect(img1.url).toBe('ipfs://QmImg1');
    expect(img1.width).toBe(512);
    expect(img1.height).toBe(512);
    expect(img1.imageIndex).toBe(0);

    const img2 = imgCalls[1][2] as LSP29EncryptedAssetImage;
    expect(img2.url).toBe('ipfs://QmImg2');
    expect(img2.width).toBe(128);
    expect(img2.height).toBe(128);
    expect(img2.imageIndex).toBe(1);
  });

  it('returns entityUpdates with version, contentId, revision, createdAt', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-updates-1',
      url: 'ipfs://QmUpdates',
      isDataFetched: false,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-updates-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: VALID_LSP29_JSON,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    // The updated main entity should have entityUpdates applied
    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    expect(assetCalls.length).toBeGreaterThan(0);
    const updated = assetCalls[assetCalls.length - 1][2] as LSP29EncryptedAsset;
    expect(updated.isDataFetched).toBe(true);
    expect(updated.version).toBe('1.0.0');
    expect(updated.contentId).toBe('content-id-123');
    expect(updated.revision).toBe(3);
    expect(updated.createdAt).toEqual(new Date('2024-06-15T12:00:00Z'));
  });
});

describe('LSP29EncryptedAssetFetchHandler - Failed fetch (META-05)', () => {
  it('updates entity with error fields on fetch failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-err-1',
      url: 'ipfs://QmError',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-err-1',
        entityType: 'LSP29EncryptedAsset',
        success: false,
        error: 'Network error',
        errorCode: 'EPROTO',
        errorStatus: 502,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    expect(assetCalls.length).toBe(1);
    const updated = assetCalls[0][2] as LSP29EncryptedAsset;
    expect(updated.fetchErrorMessage).toBe('Network error');
    expect(updated.fetchErrorCode).toBe('EPROTO');
    expect(updated.fetchErrorStatus).toBe(502);
  });

  it('increments retryCount on failure', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-retry-1',
      url: 'ipfs://QmRetry',
      isDataFetched: false,
      retryCount: 1,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-retry-1',
        entityType: 'LSP29EncryptedAsset',
        success: false,
        error: 'Gateway timeout',
        errorStatus: 504,
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    const updated = assetCalls[0][2] as LSP29EncryptedAsset;
    expect(updated.retryCount).toBe(2);
  });

  it('handles parse error with invalid JSON shape', async () => {
    const batchCtx = createMockBatchCtx();
    const hctx = createMockHandlerContext(batchCtx, { isHead: true });

    const unfetched = new LSP29EncryptedAsset({
      id: 'asset-parse-1',
      url: 'ipfs://QmParse',
      isDataFetched: false,
      retryCount: 0,
    } as Partial<LSP29EncryptedAsset>);

    (hctx.store.find as ReturnType<typeof vi.fn>).mockResolvedValueOnce([unfetched]);
    (hctx.workerPool.fetchBatch as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'asset-parse-1',
        entityType: 'LSP29EncryptedAsset',
        success: true,
        data: { WrongKey: {} },
      },
    ]);

    batchCtx._entityBags.set('LSP29EncryptedAsset', new Map());

    await LSP29EncryptedAssetFetchHandler.handle(hctx, 'LSP29EncryptedAsset');

    const assetCalls = batchCtx.addEntity.mock.calls.filter(
      (c: unknown[]) => c[0] === 'LSP29EncryptedAsset',
    );
    expect(assetCalls.length).toBe(1);
    const updated = assetCalls[0][2] as LSP29EncryptedAsset;
    expect(updated.fetchErrorMessage).toBe('Error: Invalid LSP29EncryptedAsset');
    expect(updated.retryCount).toBe(1);
  });
});
