import type { IssuedAssetFilter, IssuedAssetInclude, IssuedAssetSort } from '@lsp-indexer/types';

/**
 * Query key factory for Issued Asset domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * issuedAssetKeys.all                          → ['issuedAssets']
 * issuedAssetKeys.lists()                      → ['issuedAssets', 'list']
 * issuedAssetKeys.list(...)                    → ['issuedAssets', 'list', ...]
 * issuedAssetKeys.infinites()                  → ['issuedAssets', 'infinite']
 * issuedAssetKeys.infinite(...)                → ['issuedAssets', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * Only 2 hooks: `useIssuedAssets` (paginated list) and `useInfiniteIssuedAssets`
 * (infinite scroll). No singular `useIssuedAsset` — no natural key exists.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL issued asset queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: issuedAssetKeys.all });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: issuedAssetKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: issuedAssetKeys.infinites() });
 * ```
 */
export const issuedAssetKeys = {
  /** Base key for all issued asset queries — invalidate this to clear the entire issued asset cache */
  all: ['issuedAssets'] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...issuedAssetKeys.all, 'list'] as const,

  /** Key for a specific paginated issued asset list query */
  list: (
    filter?: IssuedAssetFilter,
    sort?: IssuedAssetSort,
    limit?: number,
    offset?: number,
    include?: IssuedAssetInclude,
  ) => [...issuedAssetKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...issuedAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll issued asset query */
  infinite: (filter?: IssuedAssetFilter, sort?: IssuedAssetSort, include?: IssuedAssetInclude) =>
    [...issuedAssetKeys.infinites(), filter, sort, include] as const,
} as const;
