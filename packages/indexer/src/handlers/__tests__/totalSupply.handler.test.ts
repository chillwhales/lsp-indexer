/**
 * Unit tests for TotalSupply handler.
 *
 * Test cases:
 * - HNDL-01: FK field is preserved during entity reconstruction (regression test for #146)
 */
import { EntityCategory, type HandlerContext } from '@/core/types';
import { TotalSupply, Transfer } from '@/model';
import { Store } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';
import { zeroAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import TotalSupplyHandler from '../totalSupply.handler';
import { prefixId } from '@/utils';

// ---------------------------------------------------------------------------
// Mock BatchContext helper
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockBatchCtx() {
  const entityBags = new Map<string, Map<string, unknown>>();
  const enrichmentQueue: unknown[] = [];

  const mockCtx = {
    network: 'lukso',
    getEntities<T>(type: string): Map<string, T> {
      return (entityBags.get(type) || new Map()) as Map<string, T>;
    },
    addEntity(type: string, id: string, entity: unknown) {
      if (!entityBags.has(type)) entityBags.set(type, new Map());
      const bag = entityBags.get(type);
      if (bag) bag.set(id, entity);
    },
    queueEnrichment: vi.fn((request: unknown) => {
      enrichmentQueue.push(request);
    }),
    // Test accessors
    _entityBags: entityBags,
    _enrichmentQueue: enrichmentQueue,
  };

  return mockCtx;
}

// ---------------------------------------------------------------------------
// Mock Store helper
// ---------------------------------------------------------------------------
function createMockStore(existingTotalSupplies: TotalSupply[] = []): Store {
  return {
    findBy: vi.fn((entityClass: unknown, where: { id: { _type: string; value: string[] } }) => {
      const ids = where.id.value;
      if (entityClass === TotalSupply) {
        return Promise.resolve(existingTotalSupplies.filter((e) => ids.includes(e.id)));
      }
      return Promise.resolve([]);
    }),
  } as unknown as Store;
}

// ---------------------------------------------------------------------------
// Mock HandlerContext helper
// ---------------------------------------------------------------------------
function createMockHandlerContext(batchCtx: unknown, store: Store): HandlerContext {
  return {
    batchCtx,
    store,
    context: {
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
  } as unknown as HandlerContext;
}

// ---------------------------------------------------------------------------
// Helper to create Transfer entity
// ---------------------------------------------------------------------------
function createTransfer({
  from,
  to,
  amount,
  address = '0xDA00000000000000000000000000000000000001',
  timestamp = new Date('2024-01-01T00:00:00Z'),
}: {
  from: string;
  to: string;
  amount: bigint;
  address?: string;
  timestamp?: Date;
}): Transfer {
  return new Transfer({
    id: uuidv4(),
    blockNumber: 100,
    logIndex: 1,
    transactionIndex: 1,
    timestamp,
    address,
    from,
    to,
    amount,
    tokenId: null,
    operator: from,
    force: false,
    data: '0x',
    digitalAsset: null,
    fromProfile: null,
    toProfile: null,
    operatorProfile: null,
    nft: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TotalSupplyHandler', () => {
  describe('FK field preservation', () => {
    it('preserves digitalAsset FK field during mint reconstruction (regression test for #146)', async () => {
      const batchCtx = createMockBatchCtx();
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Simulate entity loaded from DB where FK field might be missing as own property
      const existingTotalSupply = new TotalSupply({
        id: assetAddress,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        address: assetAddress,
        digitalAsset: null,
        value: 1000n,
      });

      // Simulate TypeORM behavior: delete FK property to test preservation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingTotalSupply as any).digitalAsset;

      const store = createMockStore([existingTotalSupply]);
      const hctx = createMockHandlerContext(batchCtx, store);

      // Create mint transfer (from zeroAddress)
      const transfer = createTransfer({
        from: zeroAddress,
        to: '0xBBB0000000000000000000000000000000000002',
        amount: 500n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await TotalSupplyHandler.handle(hctx, 'LSP7Transfer');

      const totalSupplies = batchCtx.getEntities<TotalSupply>('TotalSupply');
      const reconstructed = totalSupplies.get(assetAddress);

      // Critical assertion: digitalAsset FK field must exist on reconstructed entity
      expect(reconstructed).toBeDefined();
      expect(reconstructed).toHaveProperty('digitalAsset');
      expect(reconstructed?.digitalAsset).toBeNull();
      expect(reconstructed?.value).toBe(1500n); // 1000 + 500
    });

    it('preserves digitalAsset FK field during burn reconstruction (regression test for #146)', async () => {
      const batchCtx = createMockBatchCtx();
      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Simulate entity loaded from DB where FK field might be missing as own property
      const existingTotalSupply = new TotalSupply({
        id: assetAddress,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        address: assetAddress,
        digitalAsset: null,
        value: 1000n,
      });

      // Simulate TypeORM behavior: delete FK property to test preservation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      delete (existingTotalSupply as any).digitalAsset;

      const store = createMockStore([existingTotalSupply]);
      const hctx = createMockHandlerContext(batchCtx, store);

      // Create burn transfer (to zeroAddress)
      const transfer = createTransfer({
        from: '0xBBB0000000000000000000000000000000000002',
        to: zeroAddress,
        amount: 300n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await TotalSupplyHandler.handle(hctx, 'LSP7Transfer');

      const totalSupplies = batchCtx.getEntities<TotalSupply>('TotalSupply');
      const reconstructed = totalSupplies.get(assetAddress);

      // Critical assertion: digitalAsset FK field must exist on reconstructed entity
      expect(reconstructed).toBeDefined();
      expect(reconstructed).toHaveProperty('digitalAsset');
      expect(reconstructed?.digitalAsset).toBeNull();
      expect(reconstructed?.value).toBe(700n); // 1000 - 300
    });

    it('queues enrichment for digitalAsset FK', async () => {
      const batchCtx = createMockBatchCtx();
      const store = createMockStore();
      const hctx = createMockHandlerContext(batchCtx, store);

      const assetAddress = '0xDA00000000000000000000000000000000000001';

      // Create mint transfer
      const transfer = createTransfer({
        from: zeroAddress,
        to: '0xBBB0000000000000000000000000000000000002',
        amount: 1000n,
        address: assetAddress,
      });

      batchCtx.addEntity('LSP7Transfer', transfer.id, transfer);

      await TotalSupplyHandler.handle(hctx, 'LSP7Transfer');

      // Should queue enrichment for digitalAsset FK
      expect(batchCtx.queueEnrichment).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EntityCategory.DigitalAsset,
          address: assetAddress,
          entityType: 'TotalSupply',
          entityId: prefixId('lukso', assetAddress),
          fkField: 'digitalAsset',
        }),
      );
    });
  });
});
