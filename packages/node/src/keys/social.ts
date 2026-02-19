import type { FollowerSort } from '@lsp-indexer/types';

/**
 * Query key factory for Social/Follow queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 *
 * **Hierarchy:**
 * ```
 * followerKeys.all                          → ['followers']
 * followerKeys.followers(addr)              → ['followers', 'followers', addr]
 * followerKeys.following(addr)              → ['followers', 'following', addr]
 * followerKeys.count(addr)                  → ['followers', 'count', addr]
 * followerKeys.infiniteFollowers(addr, s)   → ['followers', 'infinite', 'followers', { address, sort }]
 * followerKeys.infiniteFollowing(addr, s)   → ['followers', 'infinite', 'following', { address, sort }]
 * ```
 */
export const followerKeys = {
  /** Base key for all follower queries — invalidate this to clear the entire follow cache */
  all: ['followers'] as const,

  /** Key for followers of a specific address (paginated list) */
  followers: (address: string) => [...followerKeys.all, 'followers', address] as const,

  /** Key for following of a specific address (paginated list) */
  following: (address: string) => [...followerKeys.all, 'following', address] as const,

  /** Key for follow count of a specific address */
  count: (address: string) => [...followerKeys.all, 'count', address] as const,

  /** Key for infinite scroll followers query */
  infiniteFollowers: (address: string, sort?: FollowerSort) =>
    [...followerKeys.all, 'infinite', 'followers', { address, sort }] as const,

  /** Key for infinite scroll following query */
  infiniteFollowing: (address: string, sort?: FollowerSort) =>
    [...followerKeys.all, 'infinite', 'following', { address, sort }] as const,
} as const;
