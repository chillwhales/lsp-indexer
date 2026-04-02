/**
 * Unit tests for LSP4MetadataBaseUri handler.
 *
 * Test cases:
 * - Creates LSP4Metadata for all NFTs when base URI changes
 * - Creates LSP4Metadata on mint when parent collection has base URI
 * - Skips mint when no base URI exists for collection
 * - URL derivation appends slash when base URI does not end with slash
 * - URL derivation does not double-slash when base URI ends with slash
 * - Uses raw tokenId as fallback when formattedTokenId is null
 * - Queues enrichment for digitalAsset and nft FKs
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { LSP4Metadata, LSP8TokenMetadataBaseURI, NFT, Transfer } from '@/model';
import { generateTokenId } from '@/utils';
import { Store } from '@subsquid/typeorm-store';
import { zeroAddress } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LSP4MetadataBaseUriHandler from '../lsp4MetadataBaseUri.handler';
import { prefixId } from '@/utils';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
function createMockBatchCtx(): {
  network: string;
  getEntities: ReturnType<typeof vi.fn>;
  addEntity: ReturnType<typeof vi.fn>;
  queueEnrichment: ReturnType<typeof vi.fn>;
  _entityBags: Map<string, Map<string, unknown>>;
  _enrichmentQueue: unknown[];
} {
  const entityBags = new Map<string, Map<string, unknown>>();
  const enrichmentQueue: unknown[] = [];

  return {
    network: 'lukso',
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
// Mock Store helper (handles both NFT and LSP8TokenMetadataBaseURI queries)
// ---------------------------------------------------------------------------
function createMockStore(
  existingNFTs: NFT[] = [],
  existingBaseURIs: LSP8TokenMetadataBaseURI[] = [],
): Store {
  return {
    findBy: vi.fn((entityClass: unknown, _where: unknown) => {
      if (entityClass === NFT) {
        return Promise.resolve(existingNFTs);
      }
      if (entityClass === LSP8TokenMetadataBaseURI) {
        return Promise.resolve(existingBaseURIs);
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
// Test data factories
// ---------------------------------------------------------------------------
const TEST_ADDRESS = '0xABC0000000000000000000000000000000000001';

function createBaseURI(
  overrides: Partial<LSP8TokenMetadataBaseURI> = {},
): LSP8TokenMetadataBaseURI {
  return new LSP8TokenMetadataBaseURI({
    id: TEST_ADDRESS,
    address: TEST_ADDRESS,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    value: 'https://example.com/metadata/',
    rawValue: '0x123456',
    digitalAsset: null,
    ...overrides,
    blockNumber: 0,
    transactionIndex: 0,
    logIndex: 0,
  });
}

function createNFT(tokenId: string, formattedTokenId: string | null = null): NFT {
  return new NFT({
    id: generateTokenId({ address: TEST_ADDRESS, tokenId }),
    tokenId,
    address: TEST_ADDRESS,
    formattedTokenId,
    digitalAsset: null,
    isMinted: true,
    isBurned: false,
  });
}

function createTransfer(tokenId: string, overrides: Partial<Transfer> = {}): Transfer {
  return new Transfer({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    blockNumber: 100,
    logIndex: 0,
    transactionIndex: 0,
    address: TEST_ADDRESS,
    from: zeroAddress,
    to: '0xBBB0000000000000000000000000000000000002',
    amount: 0n,
    tokenId,
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

describe('LSP4MetadataBaseUriHandler - Base URI Changed Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates LSP4Metadata for all NFTs when base URI changes', async () => {
    const batchCtx = createMockBatchCtx();

    // DB has 3 NFTs with formattedTokenId
    const nft1 = createNFT('0x01', '1');
    const nft2 = createNFT('0x02', '2');
    const nft3 = createNFT('0x03', '3');
    const store = createMockStore([nft1, nft2, nft3], []);

    const hctx = createMockHandlerContext(batchCtx, store);

    // Batch has base URI change
    const baseUri = createBaseURI({ value: 'https://example.com/metadata/' });
    batchCtx._entityBags.set('LSP8TokenMetadataBaseURI', new Map([[baseUri.id, baseUri]]));

    // Execute handler
    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8TokenMetadataBaseURI');

    // Verify 3 LSP4Metadata entities created
    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    expect(lsp4Entities?.size).toBe(3);

    // Verify entity IDs
    const expectedId1 = prefixId('lukso', `BaseURI - ${generateTokenId({ network: 'lukso', address: TEST_ADDRESS, tokenId: '0x01'  })}`);
    const expectedId2 = prefixId('lukso', `BaseURI - ${generateTokenId({ network: 'lukso', address: TEST_ADDRESS, tokenId: '0x02'  })}`);
    const expectedId3 = prefixId('lukso', `BaseURI - ${generateTokenId({ network: 'lukso', address: TEST_ADDRESS, tokenId: '0x03'  })}`);

    expect(lsp4Entities?.has(expectedId1)).toBe(true);
    expect(lsp4Entities?.has(expectedId2)).toBe(true);
    expect(lsp4Entities?.has(expectedId3)).toBe(true);

    // Verify URLs use formattedTokenId
    const entity1 = lsp4Entities?.get(expectedId1) as LSP4Metadata;
    const entity2 = lsp4Entities?.get(expectedId2) as LSP4Metadata;
    const entity3 = lsp4Entities?.get(expectedId3) as LSP4Metadata;

    expect(entity1.url).toBe('https://example.com/metadata/1');
    expect(entity2.url).toBe('https://example.com/metadata/2');
    expect(entity3.url).toBe('https://example.com/metadata/3');

    // Verify enrichment queued (2 per entity: digitalAsset + nft)
    expect(batchCtx._enrichmentQueue.length).toBe(6);
  });

  it('queues enrichment for digitalAsset and nft FKs', async () => {
    const batchCtx = createMockBatchCtx();
    const nft1 = createNFT('0x01', '1');
    const store = createMockStore([nft1], []);
    const hctx = createMockHandlerContext(batchCtx, store);

    const baseUri = createBaseURI();
    batchCtx._entityBags.set('LSP8TokenMetadataBaseURI', new Map([[baseUri.id, baseUri]]));

    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8TokenMetadataBaseURI');

    // Verify enrichment queue has 2 entries
    expect(batchCtx._enrichmentQueue.length).toBe(2);

    const enrichments = batchCtx._enrichmentQueue as Array<{
      category: EntityCategory;
      fkField: string;
    }>;

    expect(enrichments[0].category).toBe(EntityCategory.DigitalAsset);
    expect(enrichments[0].fkField).toBe('digitalAsset');
    expect(enrichments[1].category).toBe(EntityCategory.NFT);
    expect(enrichments[1].fkField).toBe('nft');
  });
});

describe('LSP4MetadataBaseUriHandler - Mint Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates LSP4Metadata on mint when parent collection has base URI', async () => {
    const batchCtx = createMockBatchCtx();

    // DB has base URI for the collection
    const baseUri = createBaseURI({ value: 'https://example.com/api' });
    const store = createMockStore([], [baseUri]);

    const hctx = createMockHandlerContext(batchCtx, store);

    // Batch has mint transfer
    const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000042';
    const transfer = createTransfer(tokenId, { from: zeroAddress });
    batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

    // Batch has NFT entity with formattedTokenId
    const nft = createNFT(tokenId, '42');
    batchCtx._entityBags.set('NFT', new Map([[nft.id, nft]]));

    // Execute handler
    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8Transfer');

    // Verify 1 LSP4Metadata entity created
    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    expect(lsp4Entities?.size).toBe(1);

    const expectedId = prefixId('lukso', `BaseURI - ${generateTokenId({ address: TEST_ADDRESS, tokenId })}`);
    expect(lsp4Entities?.has(expectedId)).toBe(true);

    const entity = lsp4Entities?.get(expectedId) as LSP4Metadata;
    expect(entity.url).toBe('https://example.com/api/42');
  });

  it('skips mint when no base URI exists for collection', async () => {
    const batchCtx = createMockBatchCtx();
    const store = createMockStore([], []); // No base URI in DB
    const hctx = createMockHandlerContext(batchCtx, store);

    // Batch has mint transfer but no base URI
    const transfer = createTransfer('0x01', { from: zeroAddress });
    batchCtx._entityBags.set('LSP8Transfer', new Map([[transfer.id, transfer]]));

    // Execute handler
    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8Transfer');

    // Verify no LSP4Metadata entities created
    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    expect(lsp4Entities?.size ?? 0).toBe(0);
  });
});

describe('LSP4MetadataBaseUriHandler - URL Derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends slash when base URI does not end with slash', async () => {
    const batchCtx = createMockBatchCtx();
    const nft = createNFT('0x01', '42');
    const store = createMockStore([nft], []);
    const hctx = createMockHandlerContext(batchCtx, store);

    const baseUri = createBaseURI({ value: 'https://example.com/api' }); // No trailing slash
    batchCtx._entityBags.set('LSP8TokenMetadataBaseURI', new Map([[baseUri.id, baseUri]]));

    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8TokenMetadataBaseURI');

    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    const entity = [...(lsp4Entities?.values() ?? [])][0] as LSP4Metadata;

    expect(entity.url).toBe('https://example.com/api/42');
  });

  it('does not double-slash when base URI ends with slash', async () => {
    const batchCtx = createMockBatchCtx();
    const nft = createNFT('0x01', '42');
    const store = createMockStore([nft], []);
    const hctx = createMockHandlerContext(batchCtx, store);

    const baseUri = createBaseURI({ value: 'https://example.com/api/' }); // Trailing slash
    batchCtx._entityBags.set('LSP8TokenMetadataBaseURI', new Map([[baseUri.id, baseUri]]));

    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8TokenMetadataBaseURI');

    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    const entity = [...(lsp4Entities?.values() ?? [])][0] as LSP4Metadata;

    expect(entity.url).toBe('https://example.com/api/42');
  });

  it('uses raw tokenId as fallback when formattedTokenId is null', async () => {
    const batchCtx = createMockBatchCtx();
    const tokenId = '0x123456';
    const nft = createNFT(tokenId, null); // formattedTokenId is null
    const store = createMockStore([nft], []);
    const hctx = createMockHandlerContext(batchCtx, store);

    const baseUri = createBaseURI({ value: 'https://example.com/api/' });
    batchCtx._entityBags.set('LSP8TokenMetadataBaseURI', new Map([[baseUri.id, baseUri]]));

    await LSP4MetadataBaseUriHandler.handle(hctx, 'LSP8TokenMetadataBaseURI');

    const lsp4Entities = batchCtx._entityBags.get('LSP4Metadata');
    const entity = [...(lsp4Entities?.values() ?? [])][0] as LSP4Metadata;

    // Should use raw tokenId when formattedTokenId is null
    expect(entity.url).toBe(`https://example.com/api/${tokenId}`);
  });
});
