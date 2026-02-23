import type { FollowerFilter, FollowerInclude, FollowerSort } from '@lsp-indexer/types';

/**
 * Query key factory for Follower domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
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
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL follower queries (follows + count + isFollowing)
 * queryClient.invalidateQueries({ queryKey: followerKeys.all });
 *
 * // Invalidate all follow list queries (paginated + infinite)
 * queryClient.invalidateQueries({ queryKey: followerKeys.follows() });
 *
 * // Invalidate all count queries
 * queryClient.invalidateQueries({ queryKey: followerKeys.counts() });
 *
 * // Invalidate all isFollowing queries
 * queryClient.invalidateQueries({ queryKey: followerKeys.isFollowings() });
 * ```
 */
export const followerKeys = {
  /** Base key for all follower queries — invalidate this to clear the entire follower cache */
  all: ['followers'] as const,

  /** Parent key for all follow list queries */
  follows: () => [...followerKeys.all, 'follows'] as const,

  /** Key for a specific paginated follows list query */
  list: (
    filter?: FollowerFilter,
    sort?: FollowerSort,
    limit?: number,
    offset?: number,
    include?: FollowerInclude,
  ) => [...followerKeys.follows(), 'list', filter, sort, limit, offset, include] as const,

  /** Key for a specific infinite scroll follows query */
  infinite: (filter?: FollowerFilter, sort?: FollowerSort, include?: FollowerInclude) =>
    [...followerKeys.follows(), 'infinite', filter, sort, include] as const,

  /** Parent key for all follow count queries */
  counts: () => [...followerKeys.all, 'count'] as const,

  /** Key for a specific address's follow counts */
  count: (address: string) => [...followerKeys.counts(), address] as const,

  /** Parent key for all isFollowing queries */
  isFollowings: () => [...followerKeys.all, 'is-following'] as const,

  /** Key for a specific isFollowing check between two addresses */
  isFollowing: (followerAddress: string, followedAddress: string) =>
    [...followerKeys.isFollowings(), followerAddress, followedAddress] as const,
} as const;
