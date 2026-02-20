import type { OwnedAssetFilter, OwnedAssetInclude, OwnedAssetSort } from '@lsp-indexer/types';

/**
 * Query key factory for Owned Asset domain (LSP7 fungible token ownership).
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * ownedAssetKeys.all                       → ['owned-assets']
 * ownedAssetKeys.details()                 → ['owned-assets', 'detail']
 * ownedAssetKeys.detail(id, include?)      → ['owned-assets', 'detail', { id, include }]
 * ownedAssetKeys.lists()                   → ['owned-assets', 'list']
 * ownedAssetKeys.list(f, s, l, o, i)      → ['owned-assets', 'list', { filter, sort, limit, offset, include }]
 * ownedAssetKeys.infinites()               → ['owned-assets', 'infinite']
 * ownedAssetKeys.infinite(f, s, i)         → ['owned-assets', 'infinite', { filter, sort, include }]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL owned asset queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.all });
 *
 * // Invalidate all list queries
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: ownedAssetKeys.infinites() });
 * ```
 */
export const ownedAssetKeys = {
  /** Base key for all owned asset queries — invalidate this to clear the entire owned asset cache */
  all: ['owned-assets'] as const,

  /** Parent key for all single-asset detail queries */
  details: () => [...ownedAssetKeys.all, 'detail'] as const,

  /** Key for a specific owned asset by ID and include config */
  detail: (id: string, include?: OwnedAssetInclude) =>
    [...ownedAssetKeys.details(), { id, include }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...ownedAssetKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination, and include params */
  list: (
    filter?: OwnedAssetFilter,
    sort?: OwnedAssetSort,
    limit?: number,
    offset?: number,
    include?: OwnedAssetInclude,
  ) => [...ownedAssetKeys.lists(), { filter, sort, limit, offset, include }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...ownedAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter, sort, and include params */
  infinite: (filter?: OwnedAssetFilter, sort?: OwnedAssetSort, include?: OwnedAssetInclude) =>
    [...ownedAssetKeys.infinites(), { filter, sort, include }] as const,
} as const;
