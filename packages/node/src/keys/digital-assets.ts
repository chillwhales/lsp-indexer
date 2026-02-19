import type { DigitalAssetFilter, DigitalAssetSort } from '@lsp-indexer/types';

/**
 * Query key factory for Digital Asset queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * digitalAssetKeys.all              → ['digital-assets']
 * digitalAssetKeys.details()        → ['digital-assets', 'detail']
 * digitalAssetKeys.detail(addr)     → ['digital-assets', 'detail', { address }]
 * digitalAssetKeys.lists()          → ['digital-assets', 'list']
 * digitalAssetKeys.list(f,s,l,o)    → ['digital-assets', 'list', { filter, sort, limit, offset }]
 * digitalAssetKeys.infinites()      → ['digital-assets', 'infinite']
 * digitalAssetKeys.infinite(f, s)   → ['digital-assets', 'infinite', { filter, sort }]
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
 * ```
 */
export const digitalAssetKeys = {
  /** Base key for all digital asset queries — invalidate this to clear the entire digital asset cache */
  all: ['digital-assets'] as const,

  /** Parent key for all single-asset detail queries */
  details: () => [...digitalAssetKeys.all, 'detail'] as const,

  /** Key for a specific digital asset by address */
  detail: (address: string) => [...digitalAssetKeys.details(), { address }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...digitalAssetKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: DigitalAssetFilter, sort?: DigitalAssetSort, limit?: number, offset?: number) =>
    [...digitalAssetKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...digitalAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: DigitalAssetFilter, sort?: DigitalAssetSort) =>
    [...digitalAssetKeys.infinites(), { filter, sort }] as const,
} as const;
