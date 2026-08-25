import type { UseIsFollowingBatchParams } from '@lsp-indexer/types';

const ROOT = ['lsp-indexer', 'v3'] as const;
type QueryKey = readonly unknown[];

interface ListKeyFactory {
  all(network: string): QueryKey;
  lists(network: string): QueryKey;
  list(
    network: string,
    filter?: unknown,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ): QueryKey;
  infinites(network: string): QueryKey;
  infinite(network: string, filter?: unknown, sort?: unknown, include?: unknown): QueryKey;
}

interface DetailListKeyFactory extends ListKeyFactory {
  details(network: string): QueryKey;
  detail(network: string, id: string, include?: unknown): QueryKey;
}

function domain(network: string, name: string): readonly unknown[] {
  return [...ROOT, network, name] as const;
}

function listKey(
  network: string,
  name: string,
  filter?: unknown,
  sort?: unknown,
  limit?: number,
  offset?: number,
  include?: unknown,
): readonly unknown[] {
  return [...domain(network, name), 'list', { filter, sort, limit, offset, include }] as const;
}

function infiniteKey(
  network: string,
  name: string,
  filter?: unknown,
  sort?: unknown,
  include?: unknown,
): readonly unknown[] {
  return [...domain(network, name), 'infinite', { filter, sort, include }] as const;
}

export const profileKeys = {
  all: (network: string) => domain(network, 'profiles'),
  details: (network: string) => [...domain(network, 'profiles'), 'detail'] as const,
  detail: (network: string, address: string, include?: unknown) =>
    [...profileKeys.details(network), { address: address.toLowerCase(), include }] as const,
  lists: (network: string) => [...domain(network, 'profiles'), 'list'] as const,
  list: (
    network: string,
    filter?: unknown,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) => listKey(network, 'profiles', filter, sort, limit, offset, include),
  infinites: (network: string) => [...domain(network, 'profiles'), 'infinite'] as const,
  infinite: (network: string, filter?: unknown, sort?: unknown, include?: unknown) =>
    infiniteKey(network, 'profiles', filter, sort, include),
} as const;

export const digitalAssetKeys = {
  all: (network: string) => domain(network, 'digital-assets'),
  details: (network: string) => [...domain(network, 'digital-assets'), 'detail'] as const,
  detail: (network: string, address: string, include?: unknown) =>
    [...digitalAssetKeys.details(network), { address: address.toLowerCase(), include }] as const,
  lists: (network: string) => [...domain(network, 'digital-assets'), 'list'] as const,
  list: (
    network: string,
    filter?: unknown,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) => listKey(network, 'digital-assets', filter, sort, limit, offset, include),
  infinites: (network: string) => [...domain(network, 'digital-assets'), 'infinite'] as const,
  infinite: (network: string, filter?: unknown, sort?: unknown, include?: unknown) =>
    infiniteKey(network, 'digital-assets', filter, sort, include),
} as const;

export const nftKeys = {
  all: (network: string) => domain(network, 'nfts'),
  details: (network: string) => [...domain(network, 'nfts'), 'detail'] as const,
  detail: (
    network: string,
    address: string,
    tokenId?: string,
    formattedTokenId?: string,
    include?: unknown,
  ) =>
    [
      ...nftKeys.details(network),
      { address: address.toLowerCase(), tokenId, formattedTokenId, include },
    ] as const,
  lists: (network: string) => [...domain(network, 'nfts'), 'list'] as const,
  list: (
    network: string,
    filter?: unknown,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) => listKey(network, 'nfts', filter, sort, limit, offset, include),
  infinites: (network: string) => [...domain(network, 'nfts'), 'infinite'] as const,
  infinite: (network: string, filter?: unknown, sort?: unknown, include?: unknown) =>
    infiniteKey(network, 'nfts', filter, sort, include),
} as const;

function ownershipKeys(name: string): DetailListKeyFactory {
  return {
    all: (network: string) => domain(network, name),
    details: (network: string) => [...domain(network, name), 'detail'] as const,
    detail: (network: string, id: string, include?: unknown) =>
      [...domain(network, name), 'detail', { id, include }] as const,
    lists: (network: string) => [...domain(network, name), 'list'] as const,
    list(
      network: string,
      filter?: unknown,
      sort?: unknown,
      limit?: number,
      offset?: number,
      include?: unknown,
    ) {
      return listKey(network, name, filter, sort, limit, offset, include);
    },
    infinites: (network: string) => [...domain(network, name), 'infinite'] as const,
    infinite(network: string, filter?: unknown, sort?: unknown, include?: unknown) {
      return infiniteKey(network, name, filter, sort, include);
    },
  } as const;
}

export const ownedAssetKeys = ownershipKeys('owned-assets');
export const ownedTokenKeys = ownershipKeys('owned-tokens');

function listOnlyKeys(name: string): ListKeyFactory {
  return {
    all: (network: string) => domain(network, name),
    lists: (network: string) => [...domain(network, name), 'list'] as const,
    list(
      network: string,
      filter?: unknown,
      sort?: unknown,
      limit?: number,
      offset?: number,
      include?: unknown,
    ) {
      return listKey(network, name, filter, sort, limit, offset, include);
    },
    infinites: (network: string) => [...domain(network, name), 'infinite'] as const,
    infinite(network: string, filter?: unknown, sort?: unknown, include?: unknown) {
      return infiniteKey(network, name, filter, sort, include);
    },
  } as const;
}

export const creatorKeys = listOnlyKeys('creators');
export const issuedAssetKeys = listOnlyKeys('issued-assets');
export const universalReceiverEventKeys = listOnlyKeys('universal-receiver-events');

function eventKeys(name: string): ListKeyFactory & {
  latests(network: string): QueryKey;
  latest(network: string, filter?: unknown, include?: unknown): QueryKey;
} {
  return {
    ...listOnlyKeys(name),
    latests: (network: string) => [...domain(network, name), 'latest'] as const,
    latest: (network: string, filter?: unknown, include?: unknown) =>
      [...domain(network, name), 'latest', { filter, include }] as const,
  } as const;
}

export const dataChangedEventKeys = eventKeys('data-changed-events');
export const tokenIdDataChangedEventKeys = eventKeys('token-id-data-changed-events');

export const encryptedAssetKeys = {
  ...listOnlyKeys('encrypted-assets'),
  batches: (network: string) => [...domain(network, 'encrypted-assets'), 'batch'] as const,
  batch: (network: string, tuples: unknown[], include?: unknown) =>
    [...encryptedAssetKeys.batches(network), tuples, include] as const,
} as const;

export const collectionAttributeKeys = {
  all: (network: string) => domain(network, 'collection-attributes'),
  lists: (network: string) => [...domain(network, 'collection-attributes'), 'list'] as const,
  list: (network: string, collectionAddress: string) =>
    [...collectionAttributeKeys.lists(network), collectionAddress.toLowerCase()] as const,
} as const;

export const followerKeys = {
  all: (network: string) => domain(network, 'followers'),
  follows: (network: string) => [...domain(network, 'followers'), 'follows'] as const,
  list: (
    network: string,
    filter?: unknown,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) =>
    [...followerKeys.follows(network), 'list', { filter, sort, limit, offset, include }] as const,
  infinite: (network: string, filter?: unknown, sort?: unknown, include?: unknown) =>
    [...followerKeys.follows(network), 'infinite', { filter, sort, include }] as const,
  counts: (network: string) => [...domain(network, 'followers'), 'count'] as const,
  count: (network: string, address: string) =>
    [...followerKeys.counts(network), address.toLowerCase()] as const,
  isFollowings: (network: string) => [...domain(network, 'followers'), 'is-following'] as const,
  isFollowing: (network: string, followerAddress: string, followedAddress: string) =>
    [
      ...followerKeys.isFollowings(network),
      followerAddress.toLowerCase(),
      followedAddress.toLowerCase(),
    ] as const,
  isFollowingBatches: (network: string) =>
    [...domain(network, 'followers'), 'is-following-batch'] as const,
  isFollowingBatch: (network: string, pairs: UseIsFollowingBatchParams['pairs']) =>
    [...followerKeys.isFollowingBatches(network), pairs] as const,
  mutualFollowsAll: (network: string) =>
    [...domain(network, 'followers'), 'mutual-follows'] as const,
  mutualFollows: (
    network: string,
    addressA: string,
    addressB: string,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) =>
    [
      ...followerKeys.mutualFollowsAll(network),
      'list',
      { addressA, addressB, sort, limit, offset, include },
    ] as const,
  infiniteMutualFollows: (
    network: string,
    addressA: string,
    addressB: string,
    sort?: unknown,
    include?: unknown,
  ) =>
    [
      ...followerKeys.mutualFollowsAll(network),
      'infinite',
      { addressA, addressB, sort, include },
    ] as const,
  mutualFollowersAll: (network: string) =>
    [...domain(network, 'followers'), 'mutual-followers'] as const,
  mutualFollowers: (
    network: string,
    addressA: string,
    addressB: string,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) =>
    [
      ...followerKeys.mutualFollowersAll(network),
      'list',
      { addressA, addressB, sort, limit, offset, include },
    ] as const,
  infiniteMutualFollowers: (
    network: string,
    addressA: string,
    addressB: string,
    sort?: unknown,
    include?: unknown,
  ) =>
    [
      ...followerKeys.mutualFollowersAll(network),
      'infinite',
      { addressA, addressB, sort, include },
    ] as const,
  followedByMyFollowsAll: (network: string) =>
    [...domain(network, 'followers'), 'followed-by-my-follows'] as const,
  followedByMyFollows: (
    network: string,
    myAddress: string,
    targetAddress: string,
    sort?: unknown,
    limit?: number,
    offset?: number,
    include?: unknown,
  ) =>
    [
      ...followerKeys.followedByMyFollowsAll(network),
      'list',
      { myAddress, targetAddress, sort, limit, offset, include },
    ] as const,
  infiniteFollowedByMyFollows: (
    network: string,
    myAddress: string,
    targetAddress: string,
    sort?: unknown,
    include?: unknown,
  ) =>
    [
      ...followerKeys.followedByMyFollowsAll(network),
      'infinite',
      { myAddress, targetAddress, sort, include },
    ] as const,
} as const;
