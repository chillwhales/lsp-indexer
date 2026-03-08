import type { DigitalAssetFilter, DigitalAssetInclude, DigitalAssetSort } from '@lsp-indexer/types';

/**
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
 */
export const digitalAssetKeys = {
  all: ['digital-assets'] as const,

  details: () => [...digitalAssetKeys.all, 'detail'] as const,

  detail: (address: string, include?: DigitalAssetInclude) =>
    [...digitalAssetKeys.details(), { address, include }] as const,

  lists: () => [...digitalAssetKeys.all, 'list'] as const,

  list: (
    filter?: DigitalAssetFilter,
    sort?: DigitalAssetSort,
    limit?: number,
    offset?: number,
    include?: DigitalAssetInclude,
  ) => [...digitalAssetKeys.lists(), { filter, sort, limit, offset, include }] as const,

  infinites: () => [...digitalAssetKeys.all, 'infinite'] as const,

  infinite: (filter?: DigitalAssetFilter, sort?: DigitalAssetSort, include?: DigitalAssetInclude) =>
    [...digitalAssetKeys.infinites(), { filter, sort, include }] as const,
} as const;
