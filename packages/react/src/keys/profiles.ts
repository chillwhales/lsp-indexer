import type { ProfileFilter, ProfileInclude, ProfileSort } from '../types/profiles';

/**
 * Query key factory for Universal Profile queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * profileKeys.all              → ['profiles']
 * profileKeys.details()        → ['profiles', 'detail']
 * profileKeys.detail(addr, i)  → ['profiles', 'detail', { address, include }]
 * profileKeys.lists()          → ['profiles', 'list']
 * profileKeys.list(f,s,l,o,i)  → ['profiles', 'list', { filter, sort, limit, offset, include }]
 * profileKeys.infinites()      → ['profiles', 'infinite']
 * profileKeys.infinite(f, s, i)→ ['profiles', 'infinite', { filter, sort, include }]
 * ```
 *
 * **Why `list` and `infinite` are separate:**
 * `useQuery` and `useInfiniteQuery` store fundamentally different data structures
 * in the TanStack Query cache (single result vs. pages array). Sharing keys
 * between them causes cache corruption and runtime errors.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL profile queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: profileKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
 *
 * // Invalidate a specific profile detail
 * queryClient.invalidateQueries({ queryKey: profileKeys.detail('0x...') });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: profileKeys.infinites() });
 *
 * // Prefetch a specific profile
 * queryClient.prefetchQuery({
 *   queryKey: profileKeys.detail('0x...'),
 *   queryFn: () => fetchProfile(url, { address: '0x...' }),
 * });
 * ```
 */
export const profileKeys = {
  /** Base key for all profile queries — invalidate this to clear the entire profile cache */
  all: ['profiles'] as const,

  /** Parent key for all single-profile detail queries */
  details: () => [...profileKeys.all, 'detail'] as const,

  /** Key for a specific profile by address and include config */
  detail: (address: string, include?: ProfileInclude) =>
    [...profileKeys.details(), { address, include }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...profileKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination, and include params */
  list: (
    filter?: ProfileFilter,
    sort?: ProfileSort,
    limit?: number,
    offset?: number,
    include?: ProfileInclude,
  ) => [...profileKeys.lists(), { filter, sort, limit, offset, include }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...profileKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter, sort, and include params */
  infinite: (filter?: ProfileFilter, sort?: ProfileSort, include?: ProfileInclude) =>
    [...profileKeys.infinites(), { filter, sort, include }] as const,
} as const;
