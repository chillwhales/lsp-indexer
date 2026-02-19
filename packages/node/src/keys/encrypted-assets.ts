import type { EncryptedAssetFilter, EncryptedAssetSort } from '@lsp-indexer/types';

/**
 * Query key factory for LSP29 Encrypted Asset queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * encryptedAssetKeys.all                → ['encrypted-assets']
 * encryptedAssetKeys.details()          → ['encrypted-assets', 'detail']
 * encryptedAssetKeys.detail(addr)       → ['encrypted-assets', 'detail', { address }]
 * encryptedAssetKeys.lists()            → ['encrypted-assets', 'list']
 * encryptedAssetKeys.list(f,s,l,o)      → ['encrypted-assets', 'list', { filter, sort, limit, offset }]
 * encryptedAssetKeys.infinites()        → ['encrypted-assets', 'infinite']
 * encryptedAssetKeys.infinite(f, s)     → ['encrypted-assets', 'infinite', { filter, sort }]
 * ```
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL encrypted asset queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.all });
 *
 * // Invalidate all list queries (any filter/sort combination)
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.lists() });
 *
 * // Invalidate a specific encrypted asset detail
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.detail('0x...') });
 * ```
 */
export const encryptedAssetKeys = {
  /** Base key for all encrypted asset queries — invalidate this to clear the entire cache */
  all: ['encrypted-assets'] as const,

  /** Parent key for all single encrypted asset detail queries */
  details: () => [...encryptedAssetKeys.all, 'detail'] as const,

  /** Key for a specific encrypted asset by address */
  detail: (address: string) => [...encryptedAssetKeys.details(), { address }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...encryptedAssetKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (
    filter?: EncryptedAssetFilter,
    sort?: EncryptedAssetSort,
    limit?: number,
    offset?: number,
  ) => [...encryptedAssetKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...encryptedAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: EncryptedAssetFilter, sort?: EncryptedAssetSort) =>
    [...encryptedAssetKeys.infinites(), { filter, sort }] as const,
} as const;
