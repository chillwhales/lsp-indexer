import type {
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetSort,
} from '@lsp-indexer/types';

/**
 * Query key factory for Encrypted Asset domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * encryptedAssetKeys.all                          → ['encryptedAssets']
 * encryptedAssetKeys.lists()                      → ['encryptedAssets', 'list']
 * encryptedAssetKeys.list(...)                    → ['encryptedAssets', 'list', ...]
 * encryptedAssetKeys.infinites()                  → ['encryptedAssets', 'infinite']
 * encryptedAssetKeys.infinite(...)                → ['encryptedAssets', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * Only 2 hooks: `useEncryptedAssets` (paginated list) and `useInfiniteEncryptedAssets`
 * (infinite scroll). No singular `useEncryptedAsset` — no natural key exists.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL encrypted asset queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.all });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: encryptedAssetKeys.infinites() });
 * ```
 */
export const encryptedAssetKeys = {
  /** Base key for all encrypted asset queries — invalidate this to clear the entire encrypted asset cache */
  all: ['encryptedAssets'] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...encryptedAssetKeys.all, 'list'] as const,

  /** Key for a specific paginated encrypted asset list query */
  list: (
    filter?: EncryptedAssetFilter,
    sort?: EncryptedAssetSort,
    limit?: number,
    offset?: number,
    include?: EncryptedAssetInclude,
  ) => [...encryptedAssetKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...encryptedAssetKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll encrypted asset query */
  infinite: (
    filter?: EncryptedAssetFilter,
    sort?: EncryptedAssetSort,
    include?: EncryptedAssetInclude,
  ) => [...encryptedAssetKeys.infinites(), filter, sort, include] as const,
} as const;
