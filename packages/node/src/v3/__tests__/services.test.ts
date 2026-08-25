import type { Profile, ProfileResult } from '@lsp-indexer/types';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

type Execute = (url: unknown, document: unknown, variables: unknown) => Promise<unknown>;

const { executeMock } = vi.hoisted(() => ({ executeMock: vi.fn<Execute>() }));

vi.mock('../../client/execute', () => ({ execute: executeMock }));

import { IndexerError } from '../../errors';
import {
  buildCreatorSubscriptionConfig,
  buildDataChangedEventSubscriptionConfig,
  buildDigitalAssetSubscriptionConfig,
  buildEncryptedAssetSubscriptionConfig,
  buildFollowerSubscriptionConfig,
  buildIssuedAssetSubscriptionConfig,
  buildNftSubscriptionConfig,
  buildOwnedAssetSubscriptionConfig,
  buildOwnedTokenSubscriptionConfig,
  buildProfileSubscriptionConfig,
  buildTokenIdDataChangedEventSubscriptionConfig,
  buildUniversalReceiverEventSubscriptionConfig,
  fetchCollectionAttributes,
  fetchCreators,
  fetchDataChangedEvents,
  fetchDigitalAsset,
  fetchDigitalAssets,
  fetchEncryptedAssets,
  fetchEncryptedAssetsBatch,
  fetchFollowCount,
  fetchFollowedByMyFollows,
  fetchFollows,
  fetchIsFollowing,
  fetchIsFollowingBatch,
  fetchIssuedAssets,
  fetchLatestDataChangedEvent,
  fetchLatestTokenIdDataChangedEvent,
  fetchMutualFollowers,
  fetchMutualFollows,
  fetchNft,
  fetchNfts,
  fetchOwnedAsset,
  fetchOwnedAssets,
  fetchOwnedToken,
  fetchOwnedTokens,
  fetchProfile,
  fetchProfiles,
  fetchTokenIdDataChangedEvents,
  fetchUniversalReceiverEvents,
  type RichSubscriptionConfig,
} from '../services';
import {
  ADDRESS,
  HASH,
  OTHER_ADDRESS,
  OTHER_HASH,
  TOKEN_ID,
  creatorRow,
  digitalAssetRow,
  directRows,
  eventRow,
  followerRow,
  issuedAssetRow,
  metadataRevisionRow,
  nftRow,
  ownedAssetRow,
  ownedTokenRow,
  profileRow,
} from './fixtures';

const URL = 'https://indexer.example/v1/graphql';
const NETWORK = 'lukso-mainnet';
const tokenEventRow = {
  ...eventRow,
  eventName: 'TokenIdDataChanged',
  decoded: { dataKey: HASH, dataValue: '0x1234', tokenId: TOKEN_ID },
};
const receiverEventRow = {
  ...eventRow,
  eventName: 'UniversalReceiver',
  decoded: {
    from: OTHER_ADDRESS,
    typeId: HASH,
    value: '100',
    receivedData: '0x',
    returnedValue: '0x',
  },
};
const attributeRevisionRow = {
  ...metadataRevisionRow,
  tokenId: TOKEN_ID,
  kind: 'lsp4_token',
  content: {
    LSP4Metadata: {
      attributes: [
        { key: 'color', value: 'blue', type: 'string' },
        { key: 'color', value: 'blue', type: 'string' },
        { key: 'level', value: '1', type: 'number' },
      ],
    },
  },
};

function envelope(row: unknown, totalCount = 1): Record<string, unknown> {
  return { items: [row], total: { aggregate: { count: totalCount } } };
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function queryResponse(_url: unknown, document: unknown, variables: unknown): Promise<unknown> {
  const source = String(document);
  const input = JSON.stringify(variables);
  if (source.includes('V3UniversalProfiles')) return Promise.resolve(envelope(profileRow, 2));
  if (source.includes('V3DigitalAssets')) return Promise.resolve(envelope(digitalAssetRow, 3));
  if (source.includes('V3OwnedAssets')) return Promise.resolve(envelope(ownedAssetRow, 4));
  if (source.includes('V3OwnedTokens')) return Promise.resolve(envelope(ownedTokenRow, 5));
  if (source.includes('V3Followers')) return Promise.resolve(envelope(followerRow, 6));
  if (source.includes('V3Creators')) return Promise.resolve(envelope(creatorRow, 7));
  if (source.includes('V3IssuedAssets')) return Promise.resolve(envelope(issuedAssetRow, 8));
  if (source.includes('V3Events')) {
    if (input.includes('TokenIdDataChanged')) return Promise.resolve(envelope(tokenEventRow, 9));
    if (input.includes('UniversalReceiver')) return Promise.resolve(envelope(receiverEventRow, 10));
    return Promise.resolve(envelope(eventRow, 11));
  }
  if (source.includes('V3MetadataRevisions')) {
    return Promise.resolve(
      input.includes('lsp4_token')
        ? envelope(attributeRevisionRow, 1)
        : envelope(metadataRevisionRow, 12),
    );
  }
  if (source.includes('V3Nfts')) return Promise.resolve(envelope(nftRow, 13));
  if (source.includes('V3IndexedHeads')) return Promise.resolve(envelope(directRows.indexedHeads));
  return Promise.reject(new Error(`Unexpected query: ${source.slice(0, 80)}`));
}

function collectMetadataFilters(value: unknown): unknown[] {
  if (isUnknownArray(value)) return value.flatMap(collectMetadataFilters);
  if (!isUnknownRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    key === 'metadataRevisions' ? [nested] : collectMetadataFilters(nested),
  );
}

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockImplementation(queryResponse);
});

describe('familiar v3 detail and list services', () => {
  it('restricts every metadata-backed relationship filter to the current revision', async () => {
    await fetchProfiles(URL, { network: NETWORK, filter: { name: 'Alice' } });
    await fetchDigitalAssets(URL, { network: NETWORK, filter: { category: 'Collectible' } });
    await fetchNfts(URL, { network: NETWORK, filter: { name: 'NFT' } });
    await fetchOwnedAssets(URL, { network: NETWORK, filter: { holderName: 'Alice' } });
    await fetchOwnedTokens(URL, {
      network: NETWORK,
      filter: { holderName: 'Alice', tokenName: 'NFT' },
    });
    await fetchFollows(URL, {
      network: NETWORK,
      filter: { followerName: 'Alice', followedName: 'Bob' },
    });
    await fetchCreators(URL, { network: NETWORK, filter: { creatorName: 'Alice' } });
    await fetchIssuedAssets(URL, { network: NETWORK, filter: { issuerName: 'Alice' } });
    await fetchDataChangedEvents(URL, {
      network: NETWORK,
      filter: { universalProfileName: 'Alice' },
    });
    await fetchEncryptedAssets(URL, {
      network: NETWORK,
      filter: { universalProfileName: 'Alice' },
    });

    const metadataFilters = executeMock.mock.calls.flatMap((call) =>
      collectMetadataFilters(call[2]),
    );
    expect(metadataFilters).toHaveLength(12);
    for (const metadataFilter of metadataFilters) {
      expect(metadataFilter).toEqual(expect.objectContaining({ is_current: { _eq: true } }));
    }
  });

  it('queries full profile and digital-asset results when include is omitted', async () => {
    const fullProfile = fetchProfile(URL, { network: NETWORK, address: ADDRESS });
    expectTypeOf(fullProfile).toEqualTypeOf<Promise<Profile | null>>();
    await expect(fullProfile).resolves.toMatchObject({
      name: 'Alice',
      network: NETWORK,
    });

    const nameOnlyProfile = fetchProfile(URL, {
      network: NETWORK,
      address: ADDRESS,
      include: { name: true },
    });
    expectTypeOf(nameOnlyProfile).toEqualTypeOf<Promise<ProfileResult<{ name: true }> | null>>();
    await expect(nameOnlyProfile).resolves.toEqual({
      id: '42:profile',
      network: NETWORK,
      chainId: 42,
      address: ADDRESS,
      ownerAddress: OTHER_ADDRESS,
      verification: 'verified',
      name: 'Alice',
      lastBlockNumber: 123,
      lastBlockHash: HASH,
      lastTransactionHash: OTHER_HASH,
      lastTransactionIndex: 2,
      lastLogIndex: 3,
    });
    await expect(
      fetchProfiles(URL, {
        network: NETWORK,
        filter: {
          name: 'Alice',
          followedBy: ADDRESS,
          following: OTHER_ADDRESS,
          tokenOwned: { address: OTHER_ADDRESS, minBalance: '1' },
        },
        sort: { field: 'newest', direction: 'asc' },
        limit: 10,
      }),
    ).resolves.toMatchObject({ profiles: [{ name: 'Alice' }], totalCount: 2 });
    await expect(
      fetchProfiles(URL, {
        network: NETWORK,
        filter: { tokenOwned: { address: OTHER_ADDRESS, tokenId: TOKEN_ID } },
      }),
    ).resolves.toHaveProperty('profiles.0.address', ADDRESS);

    await expect(
      fetchDigitalAsset(URL, { network: NETWORK, address: OTHER_ADDRESS }),
    ).resolves.toMatchObject({ name: 'Token', totalSupply: 900_719_925_474_099_300_000n });
    await expect(
      fetchDigitalAssets(URL, {
        network: NETWORK,
        filter: {
          name: 'Token',
          symbol: 'TKN',
          tokenType: 'TOKEN',
          category: 'Collectible',
          holderAddress: ADDRESS,
          ownerAddress: ADDRESS,
        },
        sort: { field: 'totalSupply', direction: 'desc', nulls: 'last' },
      }),
    ).resolves.toMatchObject({ digitalAssets: [{ symbol: 'TKN' }], totalCount: 3 });
  });

  it('queries NFTs and ownership with filters, deterministic sorts, and includes', async () => {
    await expect(
      fetchNft(URL, { network: NETWORK, address: OTHER_ADDRESS, tokenId: TOKEN_ID }),
    ).resolves.toMatchObject({ name: 'NFT' });
    await expect(
      fetchNft(URL, { network: NETWORK, address: OTHER_ADDRESS, formattedTokenId: '1' }),
    ).resolves.toMatchObject({ tokenId: TOKEN_ID });
    await expect(
      fetchNfts(URL, {
        network: NETWORK,
        filter: {
          collectionAddress: OTHER_ADDRESS,
          tokenId: TOKEN_ID,
          formattedTokenId: '1',
          name: 'NFT',
          holderAddress: ADDRESS,
          isBurned: false,
          isMinted: true,
          chillClaimed: true,
          orbsClaimed: false,
          maxLevel: 2,
          cooldownExpiryBefore: 1000,
        },
        sort: { field: 'tokenId', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ nfts: [{ name: 'NFT' }], totalCount: 13 });

    await expect(
      fetchOwnedAsset(URL, { network: NETWORK, id: '42:owned-asset' }),
    ).resolves.toMatchObject({ balance: 1_000_000_000_000_000_000n });
    await expect(
      fetchOwnedAssets(URL, {
        network: NETWORK,
        filter: {
          holderAddress: ADDRESS,
          digitalAssetAddress: OTHER_ADDRESS,
          holderName: 'Alice',
          assetName: 'Token',
        },
        sort: { field: 'balance', direction: 'desc' },
      }),
    ).resolves.toMatchObject({ totalCount: 4 });

    await expect(
      fetchOwnedToken(URL, { network: NETWORK, id: '42:owned-token' }),
    ).resolves.toMatchObject({ tokenId: TOKEN_ID });
    await expect(
      fetchOwnedTokens(URL, {
        network: NETWORK,
        filter: {
          holderAddress: ADDRESS,
          digitalAssetAddress: OTHER_ADDRESS,
          tokenId: TOKEN_ID,
          holderName: 'Alice',
          assetName: 'Token',
          tokenName: 'NFT',
        },
        sort: { field: 'digitalAssetAddress', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ totalCount: 5 });
  });

  it('queries follower relationships, counts, batches, and related profiles', async () => {
    await expect(
      fetchFollows(URL, {
        network: NETWORK,
        filter: {
          followerAddress: ADDRESS,
          followedAddress: OTHER_ADDRESS,
          followerName: 'Alice',
          followedName: 'Bob',
          timestampFrom: '2026-01-01T00:00:00Z',
          timestampTo: 1_800_000_000,
        },
        sort: { field: 'followerAddress', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ follows: [{ isFollowing: true }], totalCount: 6 });
    await expect(fetchFollowCount(URL, { network: NETWORK, address: ADDRESS })).resolves.toEqual({
      network: NETWORK,
      chainId: 42,
      followerCount: 6,
      followingCount: 6,
    });
    await expect(
      fetchIsFollowing(URL, {
        network: NETWORK,
        followerAddress: ADDRESS,
        followedAddress: OTHER_ADDRESS,
      }),
    ).resolves.toBe(true);
    const batch = await fetchIsFollowingBatch(URL, {
      network: NETWORK,
      pairs: [
        { followerAddress: ADDRESS, followedAddress: OTHER_ADDRESS },
        { followerAddress: OTHER_ADDRESS, followedAddress: ADDRESS },
      ],
    });
    expect(batch.get(`${ADDRESS}:${OTHER_ADDRESS}`)).toBe(true);
    expect(batch.get(`${OTHER_ADDRESS}:${ADDRESS}`)).toBe(false);

    await expect(
      fetchMutualFollows(URL, {
        network: NETWORK,
        addressA: ADDRESS,
        addressB: OTHER_ADDRESS,
      }),
    ).resolves.toHaveProperty('profiles.0.name', 'Alice');
    await expect(
      fetchMutualFollowers(URL, {
        network: NETWORK,
        addressA: ADDRESS,
        addressB: OTHER_ADDRESS,
      }),
    ).resolves.toHaveProperty('totalCount', 2);
    await expect(
      fetchFollowedByMyFollows(URL, {
        network: NETWORK,
        myAddress: ADDRESS,
        targetAddress: OTHER_ADDRESS,
      }),
    ).resolves.toHaveProperty('profiles.0.address', ADDRESS);
  });

  it('queries creators and issued assets through v3 relationships', async () => {
    await expect(
      fetchCreators(URL, {
        network: NETWORK,
        filter: {
          creatorAddress: ADDRESS,
          digitalAssetAddress: OTHER_ADDRESS,
          interfaceId: '0x12345678',
          creatorName: 'Alice',
          digitalAssetName: 'Token',
        },
        sort: { field: 'digitalAssetAddress', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ creators: [{ verified: true }], totalCount: 7 });
    await expect(
      fetchIssuedAssets(URL, {
        network: NETWORK,
        filter: {
          issuerAddress: ADDRESS,
          assetAddress: OTHER_ADDRESS,
          interfaceId: '0x12345678',
          issuerName: 'Alice',
          digitalAssetName: 'Token',
        },
        sort: { field: 'arrayIndex', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ issuedAssets: [{ issuerAddress: ADDRESS }], totalCount: 8 });
  });
});

describe('familiar v3 event and metadata services', () => {
  it('queries data-changed histories and latest records', async () => {
    const params = {
      network: NETWORK,
      filter: {
        address: ADDRESS,
        dataKey: HASH,
        blockNumberFrom: 1,
        blockNumberTo: 200,
        timestampFrom: '2026-01-01T00:00:00Z',
        timestampTo: 1_800_000_000,
        universalProfileName: 'Alice',
        digitalAssetName: 'Token',
      },
      sort: { field: 'newest' as const, direction: 'desc' as const },
    };
    await expect(fetchDataChangedEvents(URL, params)).resolves.toMatchObject({
      dataChangedEvents: [{ dataValue: '0x1234' }],
      totalCount: 11,
    });
    await expect(fetchLatestDataChangedEvent(URL, params)).resolves.toMatchObject({
      dataKey: HASH,
    });
  });

  it('queries token data-changed and universal-receiver histories', async () => {
    const tokenParams = {
      network: NETWORK,
      filter: {
        address: ADDRESS,
        dataKey: HASH,
        tokenId: TOKEN_ID,
        digitalAssetName: 'Token',
      },
      sort: { field: 'oldest' as const, direction: 'asc' as const },
    };
    await expect(fetchTokenIdDataChangedEvents(URL, tokenParams)).resolves.toMatchObject({
      tokenIdDataChangedEvents: [{ tokenId: TOKEN_ID }],
      totalCount: 9,
    });
    await expect(fetchLatestTokenIdDataChangedEvent(URL, tokenParams)).resolves.toMatchObject({
      tokenId: TOKEN_ID,
    });
    await expect(
      fetchUniversalReceiverEvents(URL, {
        network: NETWORK,
        filter: {
          address: ADDRESS,
          from: OTHER_ADDRESS,
          typeId: HASH,
          universalProfileName: 'Alice',
        },
        sort: { field: 'newest', direction: 'desc' },
      }),
    ).resolves.toMatchObject({
      universalReceiverEvents: [{ value: 100n }],
      totalCount: 10,
    });
  });

  it('queries encrypted metadata, batches, and stable collection facets', async () => {
    await expect(
      fetchEncryptedAssets(URL, {
        network: NETWORK,
        filter: {
          address: ADDRESS,
          universalProfileName: 'Alice',
          contentId: 'content',
          revision: 1,
          encryptionMethod: 'threshold',
          fileType: 'text/plain',
          timestamp: '2026-01-01T00:00:00Z',
        },
        sort: { field: 'address', direction: 'asc' },
      }),
    ).resolves.toMatchObject({ encryptedAssets: [{ contentId: 'content' }], totalCount: 12 });
    await expect(
      fetchEncryptedAssetsBatch(URL, {
        network: NETWORK,
        tuples: [{ address: ADDRESS, contentId: 'content', revision: 1 }],
      }),
    ).resolves.toMatchObject({ encryptedAssets: [{ revision: 1 }] });
    await expect(
      fetchCollectionAttributes(URL, { network: NETWORK, collectionAddress: OTHER_ADDRESS }),
    ).resolves.toEqual({
      network: NETWORK,
      chainId: 42,
      attributes: [
        { key: 'color', value: 'blue', type: 'string' },
        { key: 'level', value: '1', type: 'number' },
      ],
      totalCount: 13,
    });
  });

  it('derives collection facets from only the latest revision of each token', async () => {
    const staleRevision = {
      ...attributeRevisionRow,
      id: '42:metadata-stale',
      lastBlockNumber: '100',
      content: {
        LSP4Metadata: {
          attributes: [{ key: 'color', value: 'red', type: 'string' }],
        },
      },
    };
    const secondTokenRevision = {
      ...attributeRevisionRow,
      id: '42:metadata-second-token',
      tokenId: OTHER_HASH,
      sourceRevision: OTHER_HASH,
      lastBlockNumber: '110',
      content: {
        LSP4Metadata: {
          attributes: [{ key: 'color', value: 'green', type: 'string' }],
        },
      },
    };
    executeMock.mockImplementation((_url, document) => {
      const source = String(document);
      if (source.includes('V3Nfts')) return Promise.resolve(envelope(nftRow, 2));
      if (source.includes('V3MetadataRevisions')) {
        return Promise.resolve({
          items: [attributeRevisionRow, secondTokenRevision, staleRevision],
          total: { aggregate: { count: 3 } },
        });
      }
      return Promise.reject(new Error(`Unexpected query: ${source.slice(0, 80)}`));
    });

    await expect(
      fetchCollectionAttributes(URL, { network: NETWORK, collectionAddress: OTHER_ADDRESS }),
    ).resolves.toEqual({
      network: NETWORK,
      chainId: 42,
      attributes: [
        { key: 'color', value: 'blue', type: 'string' },
        { key: 'color', value: 'green', type: 'string' },
        { key: 'level', value: '1', type: 'number' },
      ],
      totalCount: 2,
    });
  });
});

describe('familiar v3 validation and subscription configs', () => {
  it('rejects inputs that cannot be represented faithfully by the v3 API', async () => {
    await expect(
      fetchProfile(URL, { network: NETWORK, address: 'not-an-address' }),
    ).rejects.toMatchObject({
      category: 'VALIDATION',
      code: 'VALIDATION_FAILED',
      validationErrors: [expect.objectContaining({ path: 'address' })],
    });
    await expect(
      fetchNft(URL, { network: NETWORK, address: ADDRESS, tokenId: 'not-a-token-id' }),
    ).rejects.toMatchObject({
      category: 'VALIDATION',
      validationErrors: [expect.objectContaining({ path: 'tokenId' })],
    });
    await expect(
      fetchDataChangedEvents(URL, {
        network: NETWORK,
        filter: { dataKey: 'not-a-data-key' },
      }),
    ).rejects.toMatchObject({
      category: 'VALIDATION',
      validationErrors: [expect.objectContaining({ path: 'filter.dataKey' })],
    });
    await expect(fetchNft(URL, { network: NETWORK, address: ADDRESS })).rejects.toBeInstanceOf(
      IndexerError,
    );
    await expect(
      fetchCreators(URL, {
        network: NETWORK,
        filter: { timestampFrom: '2026-01-01T00:00:00Z' },
      }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchIssuedAssets(URL, {
        network: NETWORK,
        filter: { timestampTo: '2026-01-01T00:00:00Z' },
      }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchProfiles(URL, {
        network: NETWORK,
        sort: { field: 'name', direction: 'asc' },
      }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchNfts(URL, {
        network: NETWORK,
        sort: { field: 'score', direction: 'desc' },
      }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchEncryptedAssets(URL, { network: NETWORK, filter: { fileSize: 1 } }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchEncryptedAssetsBatch(URL, {
        network: NETWORK,
        tuples: Array.from({ length: 101 }, () => ({
          address: ADDRESS,
          contentId: 'content',
          revision: 1,
        })),
      }),
    ).rejects.toBeInstanceOf(IndexerError);
    await expect(
      fetchIsFollowingBatch(URL, {
        network: NETWORK,
        pairs: Array.from({ length: 101 }, () => ({
          followerAddress: ADDRESS,
          followedAddress: OTHER_ADDRESS,
        })),
      }),
    ).rejects.toBeInstanceOf(IndexerError);
  });

  it('wraps familiar response parse failures', async () => {
    executeMock.mockResolvedValue(envelope({ network: NETWORK }));
    await expect(fetchProfile(URL, { network: NETWORK, address: ADDRESS })).rejects.toMatchObject({
      category: 'PARSE',
      code: 'PARSE_FAILED',
    });
  });

  it('builds every familiar subscription with matching variables and parser', () => {
    expectTypeOf(buildProfileSubscriptionConfig({ network: NETWORK })).toEqualTypeOf<
      RichSubscriptionConfig<Profile>
    >();
    expectTypeOf(
      buildProfileSubscriptionConfig({ network: NETWORK, include: { name: true } }),
    ).toEqualTypeOf<RichSubscriptionConfig<ProfileResult<{ name: true }>>>();

    const cases: Array<[RichSubscriptionConfig<unknown>, unknown]> = [
      [buildProfileSubscriptionConfig({ network: NETWORK }), profileRow],
      [buildDigitalAssetSubscriptionConfig({ network: NETWORK }), digitalAssetRow],
      [buildNftSubscriptionConfig({ network: NETWORK }), nftRow],
      [buildOwnedAssetSubscriptionConfig({ network: NETWORK }), ownedAssetRow],
      [buildOwnedTokenSubscriptionConfig({ network: NETWORK }), ownedTokenRow],
      [buildFollowerSubscriptionConfig({ network: NETWORK }), followerRow],
      [buildCreatorSubscriptionConfig({ network: NETWORK }), creatorRow],
      [buildIssuedAssetSubscriptionConfig({ network: NETWORK }), issuedAssetRow],
      [buildDataChangedEventSubscriptionConfig({ network: NETWORK }), eventRow],
      [buildTokenIdDataChangedEventSubscriptionConfig({ network: NETWORK }), tokenEventRow],
      [buildUniversalReceiverEventSubscriptionConfig({ network: NETWORK }), receiverEventRow],
      [buildEncryptedAssetSubscriptionConfig({ network: NETWORK }), metadataRevisionRow],
    ];
    for (const [config, row] of cases) {
      expect(config.variables).toHaveProperty('where._and.0.network._eq', NETWORK);
      expect(config.parser(config.extract({ items: [row] }))).toHaveLength(1);
    }
  });
});
