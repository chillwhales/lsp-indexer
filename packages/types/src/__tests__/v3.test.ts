import { describe, expect, it } from 'vitest';

import {
  AddressSchema,
  ChainIdSchema,
  HashSchema,
  NetworkIdSchema,
  UseEncryptedAssetsBatchParamsSchema,
  UseIsFollowingBatchParamsSchema,
  UseProfileParamsSchema,
  V3BlockSchema,
  V3ChillwhalesNftSchema,
  V3ControllerSchema,
  V3CreatorSchema,
  V3DataValueSchema,
  V3DigitalAssetSchema,
  V3DomainSchema,
  V3EventFactSchema,
  V3FollowerSchema,
  V3IndexedHeadSchema,
  V3IssuedAssetSchema,
  V3ListParamsSchema,
  V3MetadataRevisionSchema,
  V3NftSchema,
  V3OwnedAssetSchema,
  V3OwnedTokenSchema,
  V3UniversalProfileSchema,
} from '../index';

const ADDRESS = `0x${'11'.repeat(20)}`;
const OTHER_ADDRESS = `0x${'22'.repeat(20)}`;
const HASH = `0x${'33'.repeat(32)}`;
const OTHER_HASH = `0x${'44'.repeat(32)}`;
const TOKEN_ID = `0x${'55'.repeat(32)}`;
const TIMESTAMP = '2026-08-24T12:00:00.000Z';

const projection = {
  network: 'lukso-mainnet',
  chainId: 42,
  lastBlockNumber: 123,
  lastBlockHash: HASH,
  lastTransactionHash: OTHER_HASH,
  lastTransactionIndex: 2,
  lastLogIndex: 3,
};

interface RuntimeSchema {
  safeParse(value: unknown): { success: boolean; data?: unknown };
}

const fixtures: Array<{ name: string; schema: RuntimeSchema; value: Record<string, unknown> }> = [
  {
    name: 'block',
    schema: V3BlockSchema,
    value: {
      id: '42:123',
      network: 'lukso-mainnet',
      chainId: 42,
      number: 123,
      blockNumber: 123,
      hash: HASH,
      blockHash: HASH,
      parentHash: OTHER_HASH,
      timestamp: TIMESTAMP,
    },
  },
  {
    name: 'event fact',
    schema: V3EventFactSchema,
    value: {
      id: '42:event',
      network: 'lukso-mainnet',
      chainId: 42,
      blockNumber: 123,
      blockHash: HASH,
      parentHash: OTHER_HASH,
      timestamp: TIMESTAMP,
      transactionHash: OTHER_HASH,
      transactionIndex: 2,
      logIndex: 3,
      address: ADDRESS,
      topic0: HASH,
      topics: [HASH],
      data: '0x',
      eventName: null,
      eventDomain: null,
      decoded: null,
    },
  },
  {
    name: 'universal profile',
    schema: V3UniversalProfileSchema,
    value: {
      ...projection,
      id: '42:profile',
      address: ADDRESS,
      ownerAddress: null,
      verification: 'verified',
    },
  },
  {
    name: 'digital asset',
    schema: V3DigitalAssetSchema,
    value: {
      ...projection,
      id: '42:asset',
      address: ADDRESS,
      ownerAddress: OTHER_ADDRESS,
      standard: 'lsp7',
      tokenType: 0,
      name: 'Token',
      symbol: 'TKN',
      decimals: 18,
      totalSupply: 9_007_199_254_740_993n,
      tokenIdFormat: null,
      tokenIdReferenceContract: null,
      baseUri: null,
      verification: 'verified',
    },
  },
  {
    name: 'NFT',
    schema: V3NftSchema,
    value: {
      ...projection,
      id: '42:nft',
      address: ADDRESS,
      tokenId: TOKEN_ID,
      formattedTokenId: null,
      isMinted: true,
      isBurned: false,
      ownerAddress: null,
      tokenUri: null,
      verification: 'unknown',
    },
  },
  {
    name: 'owned asset',
    schema: V3OwnedAssetSchema,
    value: {
      ...projection,
      id: '42:owned-asset',
      ownerAddress: ADDRESS,
      assetAddress: OTHER_ADDRESS,
      balance: 123n,
    },
  },
  {
    name: 'owned token',
    schema: V3OwnedTokenSchema,
    value: {
      ...projection,
      id: '42:owned-token',
      ownerAddress: ADDRESS,
      assetAddress: OTHER_ADDRESS,
      tokenId: TOKEN_ID,
      balance: 1n,
    },
  },
  {
    name: 'follower',
    schema: V3FollowerSchema,
    value: {
      ...projection,
      id: '42:follower',
      followerAddress: ADDRESS,
      followedAddress: OTHER_ADDRESS,
      isFollowing: false,
      followedAt: TIMESTAMP,
      unfollowedAt: null,
    },
  },
  {
    name: 'creator',
    schema: V3CreatorSchema,
    value: {
      ...projection,
      id: '42:creator',
      assetAddress: ADDRESS,
      creatorAddress: OTHER_ADDRESS,
      arrayIndex: 0n,
      interfaceId: '0x12345678',
      verified: true,
    },
  },
  {
    name: 'issued asset',
    schema: V3IssuedAssetSchema,
    value: {
      ...projection,
      id: '42:issued',
      issuerAddress: ADDRESS,
      assetAddress: OTHER_ADDRESS,
      arrayIndex: 0n,
      interfaceId: null,
    },
  },
  {
    name: 'controller',
    schema: V3ControllerSchema,
    value: {
      ...projection,
      id: '42:controller',
      profileAddress: ADDRESS,
      controllerAddress: OTHER_ADDRESS,
      arrayIndex: 0n,
      permissions: null,
      allowedCalls: null,
      allowedDataKeys: null,
    },
  },
  {
    name: 'Chillwhales NFT',
    schema: V3ChillwhalesNftSchema,
    value: {
      ...projection,
      id: '42:chillwhales',
      address: ADDRESS,
      tokenId: TOKEN_ID,
      chillClaimed: false,
      orbsClaimed: false,
      claimCheckAfterBlock: 124,
      level: null,
      cooldownExpiry: null,
      faction: null,
    },
  },
  {
    name: 'data value',
    schema: V3DataValueSchema,
    value: {
      ...projection,
      id: '42:data-value',
      address: ADDRESS,
      tokenId: null,
      dataKey: HASH,
      dataValue: '0x1234',
    },
  },
  {
    name: 'metadata revision',
    schema: V3MetadataRevisionSchema,
    value: {
      ...projection,
      id: '42:metadata',
      address: ADDRESS,
      tokenId: null,
      dataKey: HASH,
      kind: 'lsp3_profile',
      sourceRevision: HASH,
      contentUri: 'ipfs://example',
      contentHash: null,
      contentType: null,
      contentLength: null,
      content: { LSP3Profile: { name: 'Alice' } },
      fetchedAt: TIMESTAMP,
      isCurrent: true,
    },
  },
  {
    name: 'indexed head',
    schema: V3IndexedHeadSchema,
    value: {
      network: 'lukso-mainnet',
      chainId: 42,
      blockNumber: 123,
      blockHash: HASH,
      blockTimestamp: TIMESTAMP,
      finalizedBlockNumber: null,
      finalizedBlockHash: null,
      updatedAt: TIMESTAMP,
    },
  },
];

describe('@lsp-indexer/types v3', () => {
  it('validates and normalizes multi-chain scalar identities', () => {
    expect(NetworkIdSchema.parse('lukso-mainnet')).toBe('lukso-mainnet');
    expect(NetworkIdSchema.safeParse('LUKSO Mainnet').success).toBe(false);
    expect(ChainIdSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
    expect(AddressSchema.parse(ADDRESS.toUpperCase().replace('0X', '0x'))).toBe(ADDRESS);
    expect(HashSchema.parse(HASH.toUpperCase().replace('0X', '0x'))).toBe(HASH);
  });

  it.each(fixtures)('accepts a full $name fixture', ({ schema, value }) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each(fixtures)('rejects invalid network provenance for $name', ({ schema, value }) => {
    expect(schema.safeParse({ ...value, network: 'Invalid Network' }).success).toBe(false);
  });

  it('retains nullable v3 fields without weakening required provenance', () => {
    const asset = V3DigitalAssetSchema.parse(fixtures[3]?.value);
    const controller = V3ControllerSchema.parse({ ...fixtures[10]?.value, arrayIndex: null });
    expect(asset.tokenIdReferenceContract).toBeNull();
    expect(asset.totalSupply).toBe(9_007_199_254_740_993n);
    expect(controller.arrayIndex).toBeNull();
    expect(
      V3UniversalProfileSchema.safeParse({ ...fixtures[2]?.value, chainId: null }).success,
    ).toBe(false);
  });

  it('rejects lossy safe-integer provenance and scalar values', () => {
    const unsafe = Number.MAX_SAFE_INTEGER + 1;
    expect(
      V3EventFactSchema.safeParse({ ...fixtures[1]?.value, transactionIndex: unsafe }).success,
    ).toBe(false);
    expect(
      V3UniversalProfileSchema.safeParse({
        ...fixtures[2]?.value,
        lastLogIndex: unsafe,
      }).success,
    ).toBe(false);
    expect(
      V3MetadataRevisionSchema.safeParse({
        ...fixtures[13]?.value,
        contentLength: unsafe,
      }).success,
    ).toBe(false);
    expect(V3OwnedAssetSchema.safeParse({ ...fixtures[5]?.value, balance: -1n }).success).toBe(
      false,
    );
    expect(V3CreatorSchema.safeParse({ ...fixtures[8]?.value, arrayIndex: -1n }).success).toBe(
      false,
    );
  });

  it('requires canonical hashes for metadata source revisions', () => {
    expect(
      V3MetadataRevisionSchema.safeParse({
        ...fixtures[13]?.value,
        sourceRevision: '1',
      }).success,
    ).toBe(false);
  });

  it('covers every public API domain and validates list controls', () => {
    expect(V3DomainSchema.options).toHaveLength(15);
    expect(
      V3ListParamsSchema.parse({
        network: 'lukso-mainnet',
        filter: { address: { eq: ADDRESS }, and: [{ id: { neq: 'x' } }] },
        sort: [{ field: 'address', direction: 'asc', nulls: 'last' }],
        limit: 100,
        offset: 0,
      }),
    ).toMatchObject({ network: 'lukso-mainnet', limit: 100 });
    expect(V3ListParamsSchema.safeParse({ network: 'lukso-mainnet', limit: 101 }).success).toBe(
      false,
    );
  });

  it('requires an explicit network on familiar requests and caps batch inputs', () => {
    expect(UseProfileParamsSchema.safeParse({ address: ADDRESS }).success).toBe(false);
    expect(
      UseProfileParamsSchema.safeParse({ network: 'lukso-mainnet', address: ADDRESS }).success,
    ).toBe(true);
    const pairs = Array.from({ length: 101 }, () => ({
      followerAddress: ADDRESS,
      followedAddress: OTHER_ADDRESS,
    }));
    expect(
      UseIsFollowingBatchParamsSchema.safeParse({ network: 'lukso-mainnet', pairs }).success,
    ).toBe(false);
    expect(
      UseEncryptedAssetsBatchParamsSchema.safeParse({
        network: 'lukso-mainnet',
        tuples: pairs.map(() => ({ address: ADDRESS, contentId: 'asset', revision: 1 })),
      }).success,
    ).toBe(false);
  });
});
