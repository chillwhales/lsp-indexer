import type { FollowerFilter, FollowerInclude, FollowerSort } from '@lsp-indexer/types';

/**
 * Query key factory for Follower domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * The follower domain has more key namespaces than typical domains because
 * it serves 6 hooks with different query shapes:
 *
 * **Hierarchy:**
 * ```
 * followerKeys.all                          → ['followers']
 * followerKeys.followers()                  → ['followers', 'followers']
 * followerKeys.followersList(...)           → ['followers', 'followers', 'list', ...]
 * followerKeys.followersInfinite(...)       → ['followers', 'followers', 'infinite', ...]
 * followerKeys.following()                  → ['followers', 'following']
 * followerKeys.followingList(...)           → ['followers', 'following', 'list', ...]
 * followerKeys.followingInfinite(...)       → ['followers', 'following', 'infinite', ...]
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
 * // Invalidate ALL follower queries (followers + following + count + isFollowing)
 * queryClient.invalidateQueries({ queryKey: followerKeys.all });
 *
 * // Invalidate all "followers of" queries
 * queryClient.invalidateQueries({ queryKey: followerKeys.followers() });
 *
 * // Invalidate all "following" queries
 * queryClient.invalidateQueries({ queryKey: followerKeys.following() });
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

  /** Parent key for all "followers of" queries (who follows this address?) */
  followers: () => [...followerKeys.all, 'followers'] as const,

  /** Key for a specific paginated followers list query */
  followersList: (
    address: string,
    filter?: FollowerFilter,
    sort?: FollowerSort,
    limit?: number,
    offset?: number,
    include?: FollowerInclude,
  ) =>
    [...followerKeys.followers(), 'list', address, filter, sort, limit, offset, include] as const,

  /** Key for a specific infinite scroll followers query */
  followersInfinite: (
    address: string,
    filter?: FollowerFilter,
    sort?: FollowerSort,
    include?: FollowerInclude,
  ) => [...followerKeys.followers(), 'infinite', address, filter, sort, include] as const,

  /** Parent key for all "following" queries (who does this address follow?) */
  following: () => [...followerKeys.all, 'following'] as const,

  /** Key for a specific paginated following list query */
  followingList: (
    address: string,
    filter?: FollowerFilter,
    sort?: FollowerSort,
    limit?: number,
    offset?: number,
    include?: FollowerInclude,
  ) =>
    [...followerKeys.following(), 'list', address, filter, sort, limit, offset, include] as const,

  /** Key for a specific infinite scroll following query */
  followingInfinite: (
    address: string,
    filter?: FollowerFilter,
    sort?: FollowerSort,
    include?: FollowerInclude,
  ) => [...followerKeys.following(), 'infinite', address, filter, sort, include] as const,

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
