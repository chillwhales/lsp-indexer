import type {
  FollowerFilter,
  FollowerInclude,
  FollowerSort,
  ProfileInclude,
  ProfileSort,
  UseIsFollowingBatchParams,
} from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * followerKeys.all                          → ['followers']
 * followerKeys.follows()                    → ['followers', 'follows']
 * followerKeys.list(...)                    → ['followers', 'follows', 'list', ...]
 * followerKeys.infinite(...)                → ['followers', 'follows', 'infinite', ...]
 * followerKeys.counts()                     → ['followers', 'count']
 * followerKeys.count(address)               → ['followers', 'count', address]
 * followerKeys.isFollowings()               → ['followers', 'is-following']
 * followerKeys.isFollowing(f, d)            → ['followers', 'is-following', f, d]
 * followerKeys.isFollowingBatches()         → ['followers', 'is-following-batch']
 * followerKeys.isFollowingBatch(pairs)      → ['followers', 'is-following-batch', pairs]
 * ```
 */
export const followerKeys = {
  all: ['followers'] as const,

  follows: () => [...followerKeys.all, 'follows'] as const,

  list: (
    filter?: FollowerFilter,
    sort?: FollowerSort,
    limit?: number,
    offset?: number,
    include?: FollowerInclude,
  ) => [...followerKeys.follows(), 'list', filter, sort, limit, offset, include] as const,

  infinite: (filter?: FollowerFilter, sort?: FollowerSort, include?: FollowerInclude) =>
    [...followerKeys.follows(), 'infinite', filter, sort, include] as const,

  counts: () => [...followerKeys.all, 'count'] as const,

  count: (address: string) => [...followerKeys.counts(), address] as const,

  isFollowings: () => [...followerKeys.all, 'is-following'] as const,

  isFollowing: (followerAddress: string, followedAddress: string) =>
    [...followerKeys.isFollowings(), followerAddress, followedAddress] as const,

  isFollowingBatches: () => [...followerKeys.all, 'is-following-batch'] as const,

  isFollowingBatch: (pairs: UseIsFollowingBatchParams['pairs']) =>
    [...followerKeys.isFollowingBatches(), pairs] as const,

  // ---------------------------------------------------------------------------
  // Mutual follow keys
  // ---------------------------------------------------------------------------

  mutualFollows: (
    addressA: string,
    addressB: string,
    sort?: ProfileSort,
    limit?: number,
    offset?: number,
    include?: ProfileInclude,
  ) =>
    [
      ...followerKeys.all,
      'mutual-follows',
      'list',
      addressA,
      addressB,
      sort,
      limit,
      offset,
      include,
    ] as const,

  infiniteMutualFollows: (
    addressA: string,
    addressB: string,
    sort?: ProfileSort,
    include?: ProfileInclude,
  ) =>
    [...followerKeys.all, 'mutual-follows', 'infinite', addressA, addressB, sort, include] as const,

  mutualFollowers: (
    addressA: string,
    addressB: string,
    sort?: ProfileSort,
    limit?: number,
    offset?: number,
    include?: ProfileInclude,
  ) =>
    [
      ...followerKeys.all,
      'mutual-followers',
      'list',
      addressA,
      addressB,
      sort,
      limit,
      offset,
      include,
    ] as const,

  infiniteMutualFollowers: (
    addressA: string,
    addressB: string,
    sort?: ProfileSort,
    include?: ProfileInclude,
  ) =>
    [
      ...followerKeys.all,
      'mutual-followers',
      'infinite',
      addressA,
      addressB,
      sort,
      include,
    ] as const,

  followedByMyFollows: (
    myAddress: string,
    targetAddress: string,
    sort?: ProfileSort,
    limit?: number,
    offset?: number,
    include?: ProfileInclude,
  ) =>
    [
      ...followerKeys.all,
      'followed-by-my-follows',
      'list',
      myAddress,
      targetAddress,
      sort,
      limit,
      offset,
      include,
    ] as const,

  infiniteFollowedByMyFollows: (
    myAddress: string,
    targetAddress: string,
    sort?: ProfileSort,
    include?: ProfileInclude,
  ) =>
    [
      ...followerKeys.all,
      'followed-by-my-follows',
      'infinite',
      myAddress,
      targetAddress,
      sort,
      include,
    ] as const,
} as const;
