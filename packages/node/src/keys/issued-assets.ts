import type { IssuedAssetFilter, IssuedAssetInclude, IssuedAssetSort } from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * issuedAssetKeys.all                          → ['issuedAssets']
 * issuedAssetKeys.lists()                      → ['issuedAssets', 'list']
 * issuedAssetKeys.list(...)                    → ['issuedAssets', 'list', ...]
 * issuedAssetKeys.infinites()                  → ['issuedAssets', 'infinite']
 * issuedAssetKeys.infinite(...)                → ['issuedAssets', 'infinite', ...]
 * ```
 */
export const issuedAssetKeys = {
  all: ['issuedAssets'] as const,

  lists: () => [...issuedAssetKeys.all, 'list'] as const,

  list: (
    filter?: IssuedAssetFilter,
    sort?: IssuedAssetSort,
    limit?: number,
    offset?: number,
    include?: IssuedAssetInclude,
  ) => [...issuedAssetKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...issuedAssetKeys.all, 'infinite'] as const,

  infinite: (filter?: IssuedAssetFilter, sort?: IssuedAssetSort, include?: IssuedAssetInclude) =>
    [...issuedAssetKeys.infinites(), filter, sort, include] as const,
} as const;
