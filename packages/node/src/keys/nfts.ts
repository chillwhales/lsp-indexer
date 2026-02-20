import type { NftFilter, NftInclude, NftSort } from '@lsp-indexer/types';

/**
 * Query key factory for NFT domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * nftKeys.all                              → ['nfts']
 * nftKeys.details()                        → ['nfts', 'detail']
 * nftKeys.detail(address, tokenId, include?) → ['nfts', 'detail', { address, tokenId, include }]
 * nftKeys.lists()                          → ['nfts', 'list']
 * nftKeys.list(filter?, sort?, ...)        → ['nfts', 'list', { filter, sort, limit, offset, include }]
 * nftKeys.infinites()                      → ['nfts', 'infinite']
 * nftKeys.infinite(filter?, sort?, include?) → ['nfts', 'infinite', { filter, sort, include }]
 * ```
 *
 * **Key difference from digital-assets:** The `detail` key includes both `address`
 * AND `tokenId` since an NFT is identified by the composite (collectionAddress, tokenId) pair.
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL NFT queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: nftKeys.all });
 *
 * // Invalidate all detail queries
 * queryClient.invalidateQueries({ queryKey: nftKeys.details() });
 *
 * // Invalidate all list queries
 * queryClient.invalidateQueries({ queryKey: nftKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: nftKeys.infinites() });
 * ```
 */
export const nftKeys = {
  /** Base key for all NFT queries — invalidate this to clear the entire NFT cache */
  all: ['nfts'] as const,

  /** Parent key for all single-NFT detail queries */
  details: () => [...nftKeys.all, 'detail'] as const,

  /** Key for a specific NFT by collection address, token ID, and include config */
  detail: (address: string, tokenId: string, include?: NftInclude) =>
    [...nftKeys.details(), { address, tokenId, include }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...nftKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, pagination, and include params */
  list: (
    filter?: NftFilter,
    sort?: NftSort,
    limit?: number,
    offset?: number,
    include?: NftInclude,
  ) => [...nftKeys.lists(), { filter, sort, limit, offset, include }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...nftKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter, sort, and include params */
  infinite: (filter?: NftFilter, sort?: NftSort, include?: NftInclude) =>
    [...nftKeys.infinites(), { filter, sort, include }] as const,
} as const;
