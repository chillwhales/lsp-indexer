import type { OwnedAssetFilter, OwnedAssetInclude, OwnedAssetSort } from '@lsp-indexer/types';

/**
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
 */
export const ownedAssetKeys = {
  all: ['owned-assets'] as const,

  details: () => [...ownedAssetKeys.all, 'detail'] as const,

  detail: (id: string, include?: OwnedAssetInclude) =>
    [...ownedAssetKeys.details(), { id, include }] as const,

  lists: () => [...ownedAssetKeys.all, 'list'] as const,

  list: (
    filter?: OwnedAssetFilter,
    sort?: OwnedAssetSort,
    limit?: number,
    offset?: number,
    include?: OwnedAssetInclude,
  ) => [...ownedAssetKeys.lists(), { filter, sort, limit, offset, include }] as const,

  infinites: () => [...ownedAssetKeys.all, 'infinite'] as const,

  infinite: (filter?: OwnedAssetFilter, sort?: OwnedAssetSort, include?: OwnedAssetInclude) =>
    [...ownedAssetKeys.infinites(), { filter, sort, include }] as const,
} as const;
