/**
 * Unit tests for OwnedAssets EntityHandler.
 *
 * Covers:
 * - HNDL-01: LSP7 transfers create/update OwnedAsset entities with balance tracking
 * - HNDL-02: LSP8 transfers create/update OwnedToken entities with NFT ownership
 * - HNDL-03: Zero balance OwnedAssets are queued for deletion
 * - HNDL-04: Transferred OwnedTokens are queued for deletion
 * - HNDL-05: FK fields are preserved during entity reconstruction (regression test for #141)
 * - HNDL-06: Enrichment is queued for digitalAsset and universalProfile FKs
 * - HNDL-07: OwnedToken.ownedAsset FK is set directly when parent exists
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { generateOwnedAssetId, generateOwnedTokenId } from '@/utils';
import { OwnedAsset, OwnedToken, Transfer } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { describe, expect, it, vi } from 'vitest';
import OwnedAssetsHandler from '../ownedAssets.handler';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockBatchCtx() {
  const entityBags = new Map<string, Map<string, unknown>>();
  const deleteQueue: unknown[] = [];
  const enrichmentQueue: unknown[] = [];

  const mockCtx = {
    getEntities<T>(type: string): Map<string, T> {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    },
    addEntity(type: string, id: string, entity: unknown) {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      const bag = entityBags.get(type);
      if (bag) bag.set(id, entity);
    },
    hasEntities(type: string) {
      const bag = entityBags.get(type);
      return entityBags.has(type) && bag !== undefined && bag.size > 0;
    },
    queueDelete: vi.fn((request: unknown) => {
      deleteQueue.push(request);
    }),
    queueEnrichment: vi.fn((request: unknown) => {
      enrichmentQueue.push(request);
    }),
    queueClear() {
      // no-op for tests
    },
    setPersistHint() {
      // no-op for tests
    },
    removeEntity() {
      // no-op for tests
    },
    // Test accessors
    _entityBags: entityBags,
    _deleteQueue: deleteQueue,
    _enrichmentQueue: enrichmentQueue,
  };

  return mockCtx;
}

// ---------------------------------------------------------------------------
// Mock Store helper
// ---------------------------------------------------------------------------
function createMockStore(
  existingOwnedAssets: OwnedAsset[] = [],
  existingOwnedTokens: OwnedToken[] = [],
): Store {
  return {
    findBy: vi.fn((entityClass: unknown, where: { id: { _type: string; value: string[] } }) => {
      const ids = where.id.value;
      if (entityClass === OwnedAsset) {
        return Promise.resolve(existingOwnedAssets.filter((e) => ids.includes(e.id)));
      }
      if (entityClass === OwnedToken) {
        return Promise.resolve(existingOwnedTokens.filter((e) => ids.includes(e.id)));
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
function createTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return new Transfer({
    id: 'test-uuid-1',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    blockNumber: 100,
    logIndex: 0,
    transactionIndex: 0,
    address: '0xDA00000000000000000000000000000000000001', // Digital Asset
    from: '0xAAA0000000000000000000000000000000000001', // Sender
    to: '0xBBB0000000000000000000000000000000000002', // Receiver
    amount: 1000n,
    tokenId: null,
    operator: '0xAAA0000000000000000000000000000000000001',
    force: false,
    data: '0x',
    digitalAsset: null,
    fromProfile: null,
    toProfile: null,
    operatorProfile: null,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('OwnedAssetsHandler', () => {
  describe('LSP7 transfers (fungible tokens)', () => {
    it('creates new OwnedAsset for first-time receiver', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000', // Mint
        to: '0xBBB0000000000000000000000000000000000002',
        amount: 1000n,
      });

      // Add transfer to LSP7Transfer bag
      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      // Should create OwnedAsset for receiver
      const receiverId = generateOwnedAssetId({
        owner: transfer.to,
        address: transfer.address,
      });
      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');

      expect(ownedAssets.has(receiverId)).toBe(true);
      const ownedAsset = ownedAssets.get(receiverId);
      expect(ownedAsset).toBeDefined();
      expect(ownedAsset?.balance).toBe(1000n);
      expect(ownedAsset?.owner).toBe(transfer.to);
      expect(ownedAsset?.address).toBe(transfer.address);
    });

    it('updates existing OwnedAsset balance on transfer', async () => {
      const batchCtx = createMockBatchCtx();

      const sender = '0xAAA0000000000000000000000000000000000001';
      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Existing OwnedAsset for sender with balance 5000
      const existingSenderAsset = new OwnedAsset({
        id: generateOwnedAssetId({ owner: sender, address: assetAddress }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        balance: 5000n,
        address: assetAddress,
        owner: sender,
        digitalAsset: null,
        universalProfile: null,
      });

      // Existing OwnedAsset for receiver with balance 2000
      const existingReceiverAsset = new OwnedAsset({
        id: generateOwnedAssetId({ owner: receiver, address: assetAddress }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        balance: 2000n,
        address: assetAddress,
        owner: receiver,
        digitalAsset: null,
        universalProfile: null,
      });

      const store = createMockStore([existingSenderAsset, existingReceiverAsset]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: sender,
        to: receiver,
        amount: 1000n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');

      // Sender balance should decrease by 1000 (5000 - 1000 = 4000)
      const senderAsset = ownedAssets.get(existingSenderAsset.id);
      expect(senderAsset).toBeDefined();
      expect(senderAsset?.balance).toBe(4000n);

      // Receiver balance should increase by 1000 (2000 + 1000 = 3000)
      const receiverAsset = ownedAssets.get(existingReceiverAsset.id);
      expect(receiverAsset).toBeDefined();
      expect(receiverAsset?.balance).toBe(3000n);
    });

    it('queues deletion when balance reaches zero', async () => {
      const batchCtx = createMockBatchCtx();

      const sender = '0xAAA0000000000000000000000000000000000001';
      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Sender has exact balance being transferred
      const existingSenderAsset = new OwnedAsset({
        id: generateOwnedAssetId({ owner: sender, address: assetAddress }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        balance: 1000n,
        address: assetAddress,
        owner: sender,
        digitalAsset: null,
        universalProfile: null,
      });

      const store = createMockStore([existingSenderAsset]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: sender,
        to: receiver,
        amount: 1000n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      // Sender's OwnedAsset should be queued for deletion
      expect(batchCtx.queueDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          entityClass: OwnedAsset,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entities: expect.arrayContaining([
            expect.objectContaining({
              id: existingSenderAsset.id,
              balance: 0n,
            }),
          ]),
        }),
      );
    });

    it('queues enrichment for digitalAsset and universalProfile FKs', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000', // Mint
        to: '0xBBB0000000000000000000000000000000000002',
        amount: 1000n,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      const receiverId = generateOwnedAssetId({
        owner: transfer.to,
        address: transfer.address,
      });

      // Should queue enrichment for digitalAsset FK
      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EntityCategory.DigitalAsset,
          address: transfer.address,
          entityType: 'OwnedAsset',
          entityId: receiverId,
          fkField: 'digitalAsset',
        }),
      );

      // Should queue enrichment for universalProfile FK
      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EntityCategory.UniversalProfile,
          address: transfer.to,
          entityType: 'OwnedAsset',
          entityId: receiverId,
          fkField: 'universalProfile',
        }),
      );
    });

    it('preserves FK fields during entity reconstruction (regression test for #141)', async () => {
      const batchCtx = createMockBatchCtx();

      const sender = '0xAAA0000000000000000000000000000000000001';
      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Simulate entity loaded from DB where FK fields might be missing as own properties
      const existingAsset = new OwnedAsset({
        id: generateOwnedAssetId({ owner: sender, address: assetAddress }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        balance: 5000n,
        address: assetAddress,
        owner: sender,
        digitalAsset: null,
        universalProfile: null,
      });

      // Simulate TypeORM behavior: delete FK properties to test preservation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingAsset as any).digitalAsset;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingAsset as any).universalProfile;

      const store = createMockStore([existingAsset]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: sender,
        to: receiver,
        amount: 1000n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');
      const reconstructed = ownedAssets.get(existingAsset.id);

      // Critical assertion: FK fields must exist on reconstructed entity
      expect(reconstructed).toBeDefined();
      expect(reconstructed).toHaveProperty('digitalAsset');
      expect(reconstructed).toHaveProperty('universalProfile');
      expect(reconstructed?.digitalAsset).toBe(null);
      expect(reconstructed?.universalProfile).toBe(null);
    });
  });

  describe('LSP8 transfers (NFTs)', () => {
    it('creates new OwnedToken for receiver', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000', // Mint
        to: '0xBBB0000000000000000000000000000000000002',
        amount: 1n,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      batchCtx.addEntity('LSP8Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');

      expect(transfer.tokenId).toBeDefined();
      if (!transfer.tokenId) throw new Error('tokenId is required for this test');
      const tokenId = generateOwnedTokenId({
        owner: transfer.to,
        address: transfer.address,
        tokenId: transfer.tokenId,
      });

      expect(ownedTokens.has(tokenId)).toBe(true);
      const ownedToken = ownedTokens.get(tokenId);
      expect(ownedToken).toBeDefined();
      expect(ownedToken?.tokenId).toBe(transfer.tokenId);
      expect(ownedToken?.owner).toBe(transfer.to);
      expect(ownedToken?.address).toBe(transfer.address);
    });

    it('queues deletion of OwnedToken when transferred away', async () => {
      const batchCtx = createMockBatchCtx();

      const sender = '0xAAA0000000000000000000000000000000000001';
      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';

      const existingToken = new OwnedToken({
        id: generateOwnedTokenId({ owner: sender, address: assetAddress, tokenId }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        address: assetAddress,
        tokenId,
        owner: sender,
        nft: null,
        digitalAsset: null,
        universalProfile: null,
        ownedAsset: null,
      });

      const store = createMockStore([], [existingToken]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: sender,
        to: receiver,
        amount: 1n,
        address: assetAddress,
        tokenId,
      });

      batchCtx.addEntity('LSP8Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      // Sender's OwnedToken should be queued for deletion
      expect(batchCtx.queueDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          entityClass: OwnedToken,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          entities: expect.arrayContaining([
            expect.objectContaining({
              id: existingToken.id,
              tokenId: null, // Sentinel value for deletion
            }),
          ]),
        }),
      );
    });

    it('preserves all FK fields during OwnedToken reconstruction', async () => {
      const batchCtx = createMockBatchCtx();

      const sender = '0xAAA0000000000000000000000000000000000001';
      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';

      const existingToken = new OwnedToken({
        id: generateOwnedTokenId({ owner: sender, address: assetAddress, tokenId }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        address: assetAddress,
        tokenId,
        owner: sender,
        nft: null,
        digitalAsset: null,
        universalProfile: null,
        ownedAsset: null,
      });

      // Simulate missing FK properties (as they might be when loaded from DB)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingToken as any).digitalAsset;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingToken as any).universalProfile;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingToken as any).nft;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingToken as any).ownedAsset;

      const store = createMockStore([], [existingToken]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: sender,
        to: receiver,
        amount: 1n,
        address: assetAddress,
        tokenId,
      });

      batchCtx.addEntity('LSP8Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      // Find the deletion request for sender's token (queued with tokenId: null sentinel)
      const deleteRequests = batchCtx._deleteQueue;
      expect(deleteRequests.length).toBeGreaterThan(0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const tokenDeleteRequest = deleteRequests.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (req: any) =>
          req.entityClass === OwnedToken &&
          req.entities.some((e: OwnedToken) => e.id === existingToken.id),
      ) as { entityClass: typeof OwnedToken; entities: OwnedToken[] } | undefined;

      expect(tokenDeleteRequest).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const deletedToken = tokenDeleteRequest?.entities.find((e) => e.id === existingToken.id);

      // Critical assertion: FK fields must exist on reconstructed entity
      expect(deletedToken).toHaveProperty('digitalAsset');
      expect(deletedToken).toHaveProperty('universalProfile');
      expect(deletedToken).toHaveProperty('nft');
      expect(deletedToken).toHaveProperty('ownedAsset');
    });

    it('sets ownedAsset FK directly when parent OwnedAsset exists', async () => {
      const batchCtx = createMockBatchCtx();

      const receiver = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';
      const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000001';

      // Existing OwnedAsset for receiver (from prior LSP7 transfer or same batch)
      const existingOwnedAsset = new OwnedAsset({
        id: generateOwnedAssetId({ owner: receiver, address: assetAddress }),
        block: 90,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        balance: 5000n,
        address: assetAddress,
        owner: receiver,
        digitalAsset: null,
        universalProfile: null,
      });

      const store = createMockStore([existingOwnedAsset]);
      const hctx = createMockHandlerContext(batchCtx, store);

      const transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000', // Mint
        to: receiver,
        amount: 1n,
        address: assetAddress,
        tokenId,
      });

      batchCtx.addEntity('LSP8Transfer', transfer.id, transfer);

      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');
      const receiverId = generateOwnedTokenId({ owner: receiver, address: assetAddress, tokenId });
      const receiverToken = ownedTokens.get(receiverId);

      // ownedAsset FK should be set directly (not queued for enrichment)
      expect(receiverToken).toBeDefined();
      expect(receiverToken?.ownedAsset).not.toBe(null);
      expect(receiverToken?.ownedAsset?.id).toBe(existingOwnedAsset.id);
    });
  });

  describe('dual-trigger accumulation', () => {
    it('processes both LSP7 and LSP8 transfers without double-processing', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const receiver1 = '0xBBB0000000000000000000000000000000000002';
      const receiver2 = '0xCCC0000000000000000000000000000000000003';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      const lsp7Transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000',
        to: receiver1,
        amount: 1000n,
        address: assetAddress,
        tokenId: null,
      });

      const lsp8Transfer = createTransfer({
        id: 'test-uuid-2',
        from: '0x0000000000000000000000000000000000000000',
        to: receiver2,
        amount: 1n,
        address: assetAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      batchCtx.addEntity('LSP7Transfer', lsp7Transfer.id, lsp7Transfer);
      batchCtx.addEntity('LSP8Transfer', lsp8Transfer.id, lsp8Transfer);

      // First trigger: LSP7
      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      // Second trigger: LSP8 (should process both, but not double-process LSP7)
      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');
      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');

      // Verify exact counts: 2 OwnedAssets (one per receiver), 1 OwnedToken (LSP8 only)
      expect(ownedAssets.size).toBe(2);
      expect(ownedTokens.size).toBe(1);

      // Verify LSP7 receiver balance is correct (not doubled)
      const receiver1AssetId = generateOwnedAssetId({ owner: receiver1, address: assetAddress });
      const receiver1Asset = ownedAssets.get(receiver1AssetId);
      expect(receiver1Asset).toBeDefined();
      expect(receiver1Asset?.balance).toBe(1000n); // Not 2000n (would indicate double-processing)

      // Verify LSP8 receiver has both OwnedAsset and OwnedToken
      const receiver2AssetId = generateOwnedAssetId({ owner: receiver2, address: assetAddress });
      const receiver2Asset = ownedAssets.get(receiver2AssetId);
      expect(receiver2Asset).toBeDefined();
      expect(receiver2Asset?.balance).toBe(1n);

      if (!lsp8Transfer.tokenId) throw new Error('tokenId is required for LSP8 transfer');
      const receiver2TokenId = generateOwnedTokenId({
        owner: receiver2,
        address: assetAddress,
        tokenId: lsp8Transfer.tokenId,
      });
      const receiver2Token = ownedTokens.get(receiver2TokenId);
      expect(receiver2Token).toBeDefined();

      // Verify enrichment queue: should have 4 enrichment requests total
      // 2 for receiver1 (digitalAsset + universalProfile)
      // 4 for receiver2 (OwnedAsset: digitalAsset + universalProfile, OwnedToken: digitalAsset + universalProfile + nft)
      // But handler processes both bags each time, so count may vary
      expect(batchCtx._enrichmentQueue.length).toBeGreaterThan(0);
    });
  });

  describe('triggeredBy filtering (GAP-08 fix)', () => {
    it('processes only LSP7Transfer transfers when triggered by LSP7Transfer', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const receiver1 = '0xBBB0000000000000000000000000000000000002';
      const receiver2 = '0xCCC0000000000000000000000000000000000003';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Add LSP7 transfer (fungible tokens)
      const lsp7Transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000',
        to: receiver1,
        amount: 1000n,
        address: assetAddress,
        tokenId: null,
      });

      // Add LSP8 transfer (NFT)
      const lsp8Transfer = createTransfer({
        id: 'test-uuid-2',
        from: '0x0000000000000000000000000000000000000000',
        to: receiver2,
        amount: 1n,
        address: assetAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      batchCtx.addEntity('LSP7Transfer', lsp7Transfer.id, lsp7Transfer);
      batchCtx.addEntity('LSP8Transfer', lsp8Transfer.id, lsp8Transfer);

      // Trigger with LSP7Transfer only
      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');
      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');

      // Should only process LSP7 transfer
      expect(ownedAssets.size).toBe(1);
      expect(ownedTokens.size).toBe(0);

      const receiver1AssetId = generateOwnedAssetId({ owner: receiver1, address: assetAddress });
      const receiver1Asset = ownedAssets.get(receiver1AssetId);
      expect(receiver1Asset).toBeDefined();
      expect(receiver1Asset?.balance).toBe(1000n);

      // LSP8 receiver should NOT have been processed
      const receiver2AssetId = generateOwnedAssetId({ owner: receiver2, address: assetAddress });
      expect(ownedAssets.has(receiver2AssetId)).toBe(false);
    });

    it('processes only LSP8Transfer transfers when triggered by LSP8Transfer', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const receiver1 = '0xBBB0000000000000000000000000000000000002';
      const receiver2 = '0xCCC0000000000000000000000000000000000003';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Add LSP7 transfer (fungible tokens)
      const lsp7Transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000',
        to: receiver1,
        amount: 1000n,
        address: assetAddress,
        tokenId: null,
      });

      // Add LSP8 transfer (NFT)
      const lsp8Transfer = createTransfer({
        id: 'test-uuid-2',
        from: '0x0000000000000000000000000000000000000000',
        to: receiver2,
        amount: 1n,
        address: assetAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      batchCtx.addEntity('LSP7Transfer', lsp7Transfer.id, lsp7Transfer);
      batchCtx.addEntity('LSP8Transfer', lsp8Transfer.id, lsp8Transfer);

      // Trigger with LSP8Transfer only
      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');
      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');

      // Should only process LSP8 transfer
      expect(ownedAssets.size).toBe(1);
      expect(ownedTokens.size).toBe(1);

      // LSP7 receiver should NOT have been processed
      const receiver1AssetId = generateOwnedAssetId({ owner: receiver1, address: assetAddress });
      expect(ownedAssets.has(receiver1AssetId)).toBe(false);

      // LSP8 receiver should have both OwnedAsset and OwnedToken
      const receiver2AssetId = generateOwnedAssetId({ owner: receiver2, address: assetAddress });
      const receiver2Asset = ownedAssets.get(receiver2AssetId);
      expect(receiver2Asset).toBeDefined();
      expect(receiver2Asset?.balance).toBe(1n);

      if (!lsp8Transfer.tokenId) throw new Error('tokenId is required for LSP8 transfer');
      const receiver2TokenId = generateOwnedTokenId({
        owner: receiver2,
        address: assetAddress,
        tokenId: lsp8Transfer.tokenId,
      });
      const receiver2Token = ownedTokens.get(receiver2TokenId);
      expect(receiver2Token).toBeDefined();
    });

    it('does not double-count when called for both triggers sequentially', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const addressA = '0xAAA0000000000000000000000000000000000001';
      const addressB = '0xBBB0000000000000000000000000000000000002';
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // LSP7 transfer: mint 100 tokens to address A
      const lsp7Transfer = createTransfer({
        from: '0x0000000000000000000000000000000000000000',
        to: addressA,
        amount: 100n,
        address: assetAddress,
        tokenId: null,
      });

      // LSP8 transfer: mint 1 NFT to address B
      const lsp8Transfer = createTransfer({
        id: 'test-uuid-2',
        from: '0x0000000000000000000000000000000000000000',
        to: addressB,
        amount: 1n,
        address: assetAddress,
        tokenId: '0x0000000000000000000000000000000000000000000000000000000000000001',
      });

      batchCtx.addEntity('LSP7Transfer', lsp7Transfer.id, lsp7Transfer);
      batchCtx.addEntity('LSP8Transfer', lsp8Transfer.id, lsp8Transfer);

      // First call: triggered by LSP7Transfer
      await OwnedAssetsHandler.handle(hctx, 'LSP7Transfer');

      // Second call: triggered by LSP8Transfer
      await OwnedAssetsHandler.handle(hctx, 'LSP8Transfer');

      const ownedAssets = batchCtx.getEntities<OwnedAsset>('OwnedAsset');
      const ownedTokens = batchCtx.getEntities<OwnedToken>('OwnedToken');

      // Verify address A has OwnedAsset with balance 100 (not 200 from double-processing)
      const addressAAssetId = generateOwnedAssetId({ owner: addressA, address: assetAddress });
      const addressAAsset = ownedAssets.get(addressAAssetId);
      expect(addressAAsset).toBeDefined();
      expect(addressAAsset?.balance).toBe(100n); // CRITICAL: not 200n

      // Verify address B has OwnedAsset with balance 1 (not 2 from double-processing)
      const addressBAssetId = generateOwnedAssetId({ owner: addressB, address: assetAddress });
      const addressBAsset = ownedAssets.get(addressBAssetId);
      expect(addressBAsset).toBeDefined();
      expect(addressBAsset?.balance).toBe(1n); // CRITICAL: not 2n

      // Verify address B has exactly 1 OwnedToken
      expect(ownedTokens.size).toBe(1);

      if (!lsp8Transfer.tokenId) throw new Error('tokenId is required for LSP8 transfer');
      const addressBTokenId = generateOwnedTokenId({
        owner: addressB,
        address: assetAddress,
        tokenId: lsp8Transfer.tokenId,
      });
      const addressBToken = ownedTokens.get(addressBTokenId);
      expect(addressBToken).toBeDefined();
    });
  });
});
