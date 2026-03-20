import type {
  FollowerFilter,
  FollowerInclude,
  FollowerSort,
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
} as const;
