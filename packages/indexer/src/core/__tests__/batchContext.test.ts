import { DataChanged, Follow, Follower, Transfer } from '@chillwhales/typeorm';
import { describe, expect, it } from 'vitest';
import { BatchContext } from '../batchContext';
import { EnrichmentRequest, EntityCategory } from '../types';

/** Create a minimal DataChanged entity for testing. */
function dc(id: string): DataChanged {
  return new DataChanged({
    id,
    blockNumber: 0,
    transactionIndex: 0,
    logIndex: 0,
    address: '0x0000000000000000000000000000000000000001',
    dataKey: '0x',
    dataValue: '0x',
    timestamp: new Date(),
  });
}

/** Create a minimal Transfer entity for testing. */
function tr(id: string): Transfer {
  return new Transfer({
    id,
    blockNumber: 0,
    transactionIndex: 0,
    logIndex: 0,
    address: '0x0000000000000000000000000000000000000001',
    from: '0x0000000000000000000000000000000000000001',
    to: '0x0000000000000000000000000000000000000002',
    amount: 0n,
    timestamp: new Date(),
  });
}

/** Create a minimal Follow entity for testing. */
function fl(id: string): Follow {
  return new Follow({
    id,
    blockNumber: 0,
    transactionIndex: 0,
    logIndex: 0,
    address: '0x0000000000000000000000000000000000000001',
    followerAddress: '0x0000000000000000000000000000000000000001',
    followedAddress: '0x0000000000000000000000000000000000000002',
    timestamp: new Date(),
  });
}

describe('BatchContext - Enrichment Queue', () => {
  it('should start with an empty enrichment queue', () => {
    const ctx = new BatchContext();
    const queue = ctx.getEnrichmentQueue();

    expect(queue).toEqual([]);
    expect(queue.length).toBe(0);
  });

  it('should queue a single enrichment request', () => {
    const ctx = new BatchContext();

    const request: EnrichmentRequest<Transfer> = {
      category: EntityCategory.DigitalAsset,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      entityType: 'LSP7Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    ctx.queueEnrichment(request);
    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(1);
    expect(queue[0]).toEqual(request);
  });

  it('should queue multiple enrichment requests', () => {
    const ctx = new BatchContext();

    const request1: EnrichmentRequest<Transfer> = {
      category: EntityCategory.DigitalAsset,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      entityType: 'LSP7Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    const request2: EnrichmentRequest<Transfer> = {
      category: EntityCategory.UniversalProfile,
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      entityType: 'LSP7Transfer',
      entityId: 'transfer-1',
      fkField: 'fromProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    const request3: EnrichmentRequest<Transfer> = {
      category: EntityCategory.NFT,
      address: '0x9876543210fedcba9876543210fedcba98765432',
      tokenId: '42',
      entityType: 'LSP8Transfer',
      entityId: 'nft-transfer-1',
      fkField: 'nft',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    ctx.queueEnrichment(request1);
    ctx.queueEnrichment(request2);
    ctx.queueEnrichment(request3);

    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(3);
    expect(queue[0]).toEqual(request1);
    expect(queue[1]).toEqual(request2);
    expect(queue[2]).toEqual(request3);
  });

  it('should preserve all fields in enrichment requests', () => {
    const ctx = new BatchContext();

    const requestWithTokenId: EnrichmentRequest<Transfer> = {
      category: EntityCategory.NFT,
      address: '0xnftaddress',
      tokenId: '123',
      entityType: 'LSP8Transfer',
      entityId: 'nft-meta-1',
      fkField: 'nft',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    const requestWithoutTokenId: EnrichmentRequest<Transfer> = {
      category: EntityCategory.DigitalAsset,
      address: '0xdassetaddress',
      entityType: 'LSP7Transfer',
      entityId: 'token-name-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    ctx.queueEnrichment(requestWithTokenId);
    ctx.queueEnrichment(requestWithoutTokenId);

    const queue = ctx.getEnrichmentQueue();

    expect(queue[0].category).toBe(EntityCategory.NFT);
    expect(queue[0].address).toBe('0xnftaddress');
    expect(queue[0].tokenId).toBe('123');
    expect(queue[0].entityType).toBe('LSP8Transfer');
    expect(queue[0].entityId).toBe('nft-meta-1');
    expect(queue[0].fkField).toBe('nft');

    expect(queue[1].category).toBe(EntityCategory.DigitalAsset);
    expect(queue[1].address).toBe('0xdassetaddress');
    expect(queue[1].tokenId).toBeUndefined();
    expect(queue[1].entityType).toBe('LSP7Transfer');
    expect(queue[1].entityId).toBe('token-name-1');
    expect(queue[1].fkField).toBe('digitalAsset');
  });

  it('should maintain insertion order in the queue', () => {
    const ctx = new BatchContext();

    const requests: EnrichmentRequest<Transfer>[] = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        category: EntityCategory.DigitalAsset,
        address: `0xaddress${i}`,
        entityType: 'LSP7Transfer',
        entityId: `transfer-${i}`,
        fkField: 'digitalAsset',
        blockNumber: 0,
        transactionIndex: 0,
        logIndex: 0,
        timestamp: 1700000000000,
      });
      ctx.queueEnrichment(requests[i]);
    }

    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(queue[i]).toEqual(requests[i]);
    }
  });

  it('should allow same entity to be enriched multiple times with different fields', () => {
    const ctx = new BatchContext();

    const request1: EnrichmentRequest<Transfer> = {
      category: EntityCategory.UniversalProfile,
      address: '0xprofile1',
      entityType: 'LSP7Transfer',
      entityId: 'transfer-1',
      fkField: 'fromProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    const request2: EnrichmentRequest<Transfer> = {
      category: EntityCategory.UniversalProfile,
      address: '0xprofile2',
      entityType: 'LSP7Transfer',
      entityId: 'transfer-1',
      fkField: 'toProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
      timestamp: 1700000000000,
    };

    ctx.queueEnrichment(request1);
    ctx.queueEnrichment(request2);

    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(2);
    expect(queue[0].entityId).toBe('transfer-1');
    expect(queue[0].fkField).toBe('fromProfile');
    expect(queue[1].entityId).toBe('transfer-1');
    expect(queue[1].fkField).toBe('toProfile');
  });
});

describe('BatchContext - Raw Entity Type Sealing', () => {
  it('should allow adding entities before sealing', () => {
    const ctx = new BatchContext();

    ctx.addEntity('DataChanged', 'e1', dc('e1'));
    ctx.addEntity('DataChanged', 'e2', dc('e2'));
    ctx.addEntity('LSP7Transfer', 't1', tr('t1'));

    expect(ctx.hasEntities('DataChanged')).toBe(true);
    expect(ctx.hasEntities('LSP7Transfer')).toBe(true);
    expect(ctx.getEntities('DataChanged').size).toBe(2);
    expect(ctx.getEntities('LSP7Transfer').size).toBe(1);
  });

  it('should seal raw entity type keys', () => {
    const ctx = new BatchContext();

    ctx.addEntity('DataChanged', 'e1', dc('e1'));
    ctx.addEntity('LSP7Transfer', 't1', tr('t1'));

    // Seal the types
    ctx.sealRawEntityTypes();

    // Should still be able to add to new types
    ctx.addEntity('Follow', 'f1', fl('f1'));
    expect(ctx.hasEntities('Follow')).toBe(true);
  });

  it('should throw when adding to sealed type', () => {
    const ctx = new BatchContext();

    ctx.addEntity('DataChanged', 'e1', dc('e1'));
    ctx.sealRawEntityTypes();

    expect(() => {
      ctx.addEntity('DataChanged', 'e2', dc('e2'));
    }).toThrow(/Handler attempted to add entity to raw type 'DataChanged'/);
  });

  it('should throw with clear error message mentioning Step 2', () => {
    const ctx = new BatchContext();

    ctx.addEntity('LSP7Transfer', 't1', tr('t1'));
    ctx.sealRawEntityTypes();

    expect(() => {
      ctx.addEntity('LSP7Transfer', 't2', tr('t2'));
    }).toThrow(/already persisted in Step 2/);
  });

  it('should not throw for new entity types after sealing', () => {
    const ctx = new BatchContext();

    ctx.addEntity('DataChanged', 'e1', dc('e1'));
    ctx.sealRawEntityTypes();

    // These should all work fine (new types)
    expect(() => {
      ctx.addEntity('Follow', 'f1', fl('f1'));
      ctx.addEntity('LSP7Transfer', 't1', tr('t1'));
      ctx.addEntity(
        'Follower',
        'm1',
        new Follower({
          id: 'm1',
          blockNumber: 0,
          transactionIndex: 0,
          logIndex: 0,
          followerAddress: '0x01',
          followedAddress: '0x02',
          timestamp: new Date(),
        }),
      );
    }).not.toThrow();

    expect(ctx.hasEntities('Follow')).toBe(true);
    expect(ctx.hasEntities('LSP7Transfer')).toBe(true);
    expect(ctx.hasEntities('Follower')).toBe(true);
  });

  it('should allow sealing empty context', () => {
    const ctx = new BatchContext();

    expect(() => {
      ctx.sealRawEntityTypes();
    }).not.toThrow();

    // Should be able to add after sealing empty context
    ctx.addEntity('DataChanged', 'e1', dc('e1'));
    expect(ctx.hasEntities('DataChanged')).toBe(true);
  });
});
