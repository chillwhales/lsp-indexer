import { Transfer } from '@chillwhales/typeorm';
import { describe, expect, it } from 'vitest';
import { BatchContext } from '../batchContext';
import { EnrichmentRequest, Entity, EntityCategory } from '../types';

/** Create a minimal test entity with required block fields. */
function e(id: string): Entity {
  return { id, blockNumber: 0, transactionIndex: 0, logIndex: 0 };
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
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
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
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
    };

    const request2: EnrichmentRequest<Transfer> = {
      category: EntityCategory.UniversalProfile,
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'fromProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
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
      entityType: 'NFTMetadata',
      entityId: 'nft-meta-1',
      fkField: 'nft',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
    };

    const requestWithoutTokenId: EnrichmentRequest<Transfer> = {
      category: EntityCategory.DigitalAsset,
      address: '0xdassetaddress',
      entityType: 'LSP4TokenName',
      entityId: 'token-name-1',
      fkField: 'digitalAsset',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
    };

    ctx.queueEnrichment(requestWithTokenId);
    ctx.queueEnrichment(requestWithoutTokenId);

    const queue = ctx.getEnrichmentQueue();

    expect(queue[0].category).toBe(EntityCategory.NFT);
    expect(queue[0].address).toBe('0xnftaddress');
    expect(queue[0].tokenId).toBe('123');
    expect(queue[0].entityType).toBe('NFTMetadata');
    expect(queue[0].entityId).toBe('nft-meta-1');
    expect(queue[0].fkField).toBe('nft');

    expect(queue[1].category).toBe(EntityCategory.DigitalAsset);
    expect(queue[1].address).toBe('0xdassetaddress');
    expect(queue[1].tokenId).toBeUndefined();
    expect(queue[1].entityType).toBe('LSP4TokenName');
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
        entityType: 'Transfer',
        entityId: `transfer-${i}`,
        fkField: 'digitalAsset',
        blockNumber: 0,
        transactionIndex: 0,
        logIndex: 0,
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
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'fromProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
    };

    const request2: EnrichmentRequest<Transfer> = {
      category: EntityCategory.UniversalProfile,
      address: '0xprofile2',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'toProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
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

    ctx.addEntity('Event', 'e1', e('e1'));
    ctx.addEntity('Event', 'e2', e('e2'));
    ctx.addEntity('Transfer', 't1', e('t1'));

    expect(ctx.hasEntities('Event')).toBe(true);
    expect(ctx.hasEntities('Transfer')).toBe(true);
    expect(ctx.getEntities('Event').size).toBe(2);
    expect(ctx.getEntities('Transfer').size).toBe(1);
  });

  it('should seal raw entity type keys', () => {
    const ctx = new BatchContext();

    ctx.addEntity('RawEvent', 'e1', e('e1'));
    ctx.addEntity('RawTransfer', 't1', e('t1'));

    // Seal the types
    ctx.sealRawEntityTypes();

    // Should still be able to add to new types
    ctx.addEntity('DerivedEntity', 'd1', e('d1'));
    expect(ctx.hasEntities('DerivedEntity')).toBe(true);
  });

  it('should throw when adding to sealed type', () => {
    const ctx = new BatchContext();

    ctx.addEntity('RawEvent', 'e1', e('e1'));
    ctx.sealRawEntityTypes();

    expect(() => {
      ctx.addEntity('RawEvent', 'e2', e('e2'));
    }).toThrow(/Handler attempted to add entity to raw type 'RawEvent'/);
  });

  it('should throw with clear error message mentioning Step 2', () => {
    const ctx = new BatchContext();

    ctx.addEntity('Transfer', 't1', e('t1'));
    ctx.sealRawEntityTypes();

    expect(() => {
      ctx.addEntity('Transfer', 't2', e('t2'));
    }).toThrow(/already persisted in Step 2/);
  });

  it('should not throw for new entity types after sealing', () => {
    const ctx = new BatchContext();

    ctx.addEntity('RawEvent', 'e1', e('e1'));
    ctx.sealRawEntityTypes();

    // These should all work fine (new types)
    expect(() => {
      ctx.addEntity('Derived1', 'd1', e('d1'));
      ctx.addEntity('Derived2', 'd2', e('d2'));
      ctx.addEntity('Metadata', 'm1', e('m1'));
    }).not.toThrow();

    expect(ctx.hasEntities('Derived1')).toBe(true);
    expect(ctx.hasEntities('Derived2')).toBe(true);
    expect(ctx.hasEntities('Metadata')).toBe(true);
  });

  it('should allow sealing empty context', () => {
    const ctx = new BatchContext();

    expect(() => {
      ctx.sealRawEntityTypes();
    }).not.toThrow();

    // Should be able to add after sealing empty context
    ctx.addEntity('Event', 'e1', e('e1'));
    expect(ctx.hasEntities('Event')).toBe(true);
  });
});
