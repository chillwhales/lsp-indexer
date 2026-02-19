import type { NftFilter, NftSort } from '@lsp-indexer/types';

/**
 * Query key factory for NFT queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * nftKeys.all                    → ['nfts']
 * nftKeys.details()              → ['nfts', 'detail']
 * nftKeys.detail(addr, tokenId)  → ['nfts', 'detail', { address, tokenId }]
 * nftKeys.lists()                → ['nfts', 'list']
 * nftKeys.byCollection(addr)     → ['nfts', 'list', { filter: { collectionAddress } }]
 * nftKeys.list(f,s,l,o)          → ['nfts', 'list', { filter, sort, limit, offset }]
 * nftKeys.infinites()            → ['nfts', 'infinite']
 * nftKeys.infinite(f, s)         → ['nfts', 'infinite', { filter, sort }]
 * ```
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL NFT queries (detail + list + infinite)
 * queryClient.invalidateQueries({ queryKey: nftKeys.all });
 *
 * // Invalidate all list queries
 * queryClient.invalidateQueries({ queryKey: nftKeys.lists() });
 *
 * // Invalidate a specific NFT detail
 * queryClient.invalidateQueries({ queryKey: nftKeys.detail('0x...', '0x0001') });
 *
 * // Invalidate all NFTs for a collection
 * queryClient.invalidateQueries({ queryKey: nftKeys.byCollection('0x...') });
 * ```
 */
export const nftKeys = {
  /** Base key for all NFT queries — invalidate this to clear the entire NFT cache */
  all: ['nfts'] as const,

  /** Parent key for all single-NFT detail queries */
  details: () => [...nftKeys.all, 'detail'] as const,

  /** Key for a specific NFT by collection address and token ID */
  detail: (address: string, tokenId: string) =>
    [...nftKeys.details(), { address, tokenId }] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...nftKeys.all, 'list'] as const,

  /** Convenience key for NFTs filtered by collection address */
  byCollection: (collectionAddress: string) =>
    [...nftKeys.lists(), { filter: { collectionAddress } }] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: NftFilter, sort?: NftSort, limit?: number, offset?: number) =>
    [...nftKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...nftKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: NftFilter, sort?: NftSort) =>
    [...nftKeys.infinites(), { filter, sort }] as const,
} as const;
