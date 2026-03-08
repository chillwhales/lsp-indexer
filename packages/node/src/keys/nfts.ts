import type { NftFilter, NftInclude, NftSort } from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * nftKeys.all                                                   → ['nfts']
 * nftKeys.details()                                             → ['nfts', 'detail']
 * nftKeys.detail(address, tokenId?, formattedTokenId?, include?) → ['nfts', 'detail', { ... }]
 * nftKeys.lists()                                               → ['nfts', 'list']
 * nftKeys.list(filter?, sort?, ...)                             → ['nfts', 'list', { ... }]
 * nftKeys.infinites()                                           → ['nfts', 'infinite']
 * nftKeys.infinite(filter?, sort?, include?)                    → ['nfts', 'infinite', { ... }]
 * ```
 */
export const nftKeys = {
  all: ['nfts'] as const,

  details: () => [...nftKeys.all, 'detail'] as const,

  detail: (address: string, tokenId?: string, formattedTokenId?: string, include?: NftInclude) =>
    [...nftKeys.details(), { address, tokenId, formattedTokenId, include }] as const,

  lists: () => [...nftKeys.all, 'list'] as const,

  list: (
    filter?: NftFilter,
    sort?: NftSort,
    limit?: number,
    offset?: number,
    include?: NftInclude,
  ) => [...nftKeys.lists(), { filter, sort, limit, offset, include }] as const,

  infinites: () => [...nftKeys.all, 'infinite'] as const,

  infinite: (filter?: NftFilter, sort?: NftSort, include?: NftInclude) =>
    [...nftKeys.infinites(), { filter, sort, include }] as const,
} as const;
