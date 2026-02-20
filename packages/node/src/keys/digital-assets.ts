import type { DigitalAssetFilter, DigitalAssetInclude, DigitalAssetSort } from '@lsp-indexer/types';

/**
 * Query key factory for Digital Asset queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * digitalAssetKeys.all                  → ['digital-assets']
 * digitalAssetKeys.details()            → ['digital-assets', 'detail']
 * digitalAssetKeys.detail(addr, i)      → ['digital-assets', 'detail', { address, include }]
 * digitalAssetKeys.lists()              → ['digital-assets', 'list']
 * digitalAssetKeys.list(f,s,l,o,i)     → ['digital-assets', 'list', { filter, sort, limit, offset, include }]
 * digitalAssetKeys.infinites()          → ['digital-assets', 'infinite']
 * digitalAssetKeys.infinite(f, s, i)   → ['digital-assets', 'infinite', { filter, sort, include }]
 * ```
 *
 * **Why `list` and `infinite` are separate:**
 * `useQuery` and `useInfiniteQuery` store fundamentally different data structures
 * in the TanStack Query cache (single result vs. pages array). Sharing keys
 * between them causes cache corruption and runtime errors.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL digital asset queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: digitalAssetKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: digitalAssetKeys.lists() });
 *
 * // Invalidate a specific digital asset detail
 * queryClient.invalidateQueries({ queryKey: digitalAssetKeys.detail('0x...') });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: digitalAssetKeys.infinites() });
 *
 * // Prefetch a specific digital asset
 * queryClient.prefetchQuery({
 *   queryKey: digitalAssetKeys.detail('0x...'),
 *   queryFn: () => fetchDigitalAsset(url, { address: '0x...' }),
 * });
 * ```
 */
export const digitalAssetKeys = {
  /** Base key for all digital asset queries — invalidate this to clear the entire digital asset cache */
  all: ['digital-assets'] as const,

  /** Parent key for all single-asset detail queries */
  details: () => [...digitalAssetKeys.all, 'detail'] as const,

  /** Key for a specific digital asset by address and include config */
  detail: (address: string, include?: DigitalAssetInclude) =>
    [...digitalAssetKeys.details(), { address, include }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...digitalAssetKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination, and include params */
  list: (
    filter?: DigitalAssetFilter,
    sort?: DigitalAssetSort,
    limit?: number,
    offset?: number,
    include?: DigitalAssetInclude,
  ) => [...digitalAssetKeys.lists(), { filter, sort, limit, offset, include }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...digitalAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter, sort, and include params */
  infinite: (filter?: DigitalAssetFilter, sort?: DigitalAssetSort, include?: DigitalAssetInclude) =>
    [...digitalAssetKeys.infinites(), { filter, sort, include }] as const,
} as const;
