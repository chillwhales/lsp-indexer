import { describe, expect, it } from 'vitest';
import { BatchContext } from '../batchContext';
import { EnrichmentRequest, EntityCategory } from '../types';

describe('BatchContext - Enrichment Queue', () => {
  it('should start with an empty enrichment queue', () => {
    const ctx = new BatchContext();
    const queue = ctx.getEnrichmentQueue();

    expect(queue).toEqual([]);
    expect(queue.length).toBe(0);
  });

  it('should queue a single enrichment request', () => {
    const ctx = new BatchContext();

    const request: EnrichmentRequest = {
      category: EntityCategory.DigitalAsset,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
    };

    ctx.queueEnrichment(request);
    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(1);
    expect(queue[0]).toEqual(request);
  });

  it('should queue multiple enrichment requests', () => {
    const ctx = new BatchContext();

    const request1: EnrichmentRequest = {
      category: EntityCategory.DigitalAsset,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'digitalAsset',
    };

    const request2: EnrichmentRequest = {
      category: EntityCategory.UniversalProfile,
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'from',
    };

    const request3: EnrichmentRequest = {
      category: 'NFT',
      address: '0x9876543210fedcba9876543210fedcba98765432',
      tokenId: '42',
      entityType: 'LSP8Transfer',
      entityId: 'nft-transfer-1',
      fkField: 'nft',
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

    const requestWithTokenId: EnrichmentRequest = {
      category: 'NFT',
      address: '0xnftaddress',
      tokenId: '123',
      entityType: 'NFTMetadata',
      entityId: 'nft-meta-1',
      fkField: 'nft',
    };

    const requestWithoutTokenId: EnrichmentRequest = {
      category: EntityCategory.DigitalAsset,
      address: '0xdassetaddress',
      entityType: 'LSP4TokenName',
      entityId: 'token-name-1',
      fkField: 'digitalAsset',
    };

    ctx.queueEnrichment(requestWithTokenId);
    ctx.queueEnrichment(requestWithoutTokenId);

    const queue = ctx.getEnrichmentQueue();

    expect(queue[0].category).toBe('NFT');
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

    const requests: EnrichmentRequest[] = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        category: EntityCategory.DigitalAsset,
        address: `0xaddress${i}`,
        entityType: 'Transfer',
        entityId: `transfer-${i}`,
        fkField: 'digitalAsset',
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

    const request1: EnrichmentRequest = {
      category: EntityCategory.UniversalProfile,
      address: '0xprofile1',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'from',
    };

    const request2: EnrichmentRequest = {
      category: EntityCategory.UniversalProfile,
      address: '0xprofile2',
      entityType: 'Transfer',
      entityId: 'transfer-1',
      fkField: 'to',
    };

    ctx.queueEnrichment(request1);
    ctx.queueEnrichment(request2);

    const queue = ctx.getEnrichmentQueue();

    expect(queue.length).toBe(2);
    expect(queue[0].entityId).toBe('transfer-1');
    expect(queue[0].fkField).toBe('from');
    expect(queue[1].entityId).toBe('transfer-1');
    expect(queue[1].fkField).toBe('to');
  });
});
