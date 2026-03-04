/**
 * Factory for useNfts — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseNfts(queryFn)` with its own fetch function:
 * - React: `(p) => fetchNfts(getClientUrl(), p)`
 * - Next:  `(p) => getNfts(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchNftsResult } from '@lsp-indexer/node';
import { nftKeys } from '@lsp-indexer/node';
import type { Nft, NftInclude, NftResult, PartialNft, UseNftsParams } from '@lsp-indexer/types';
import type { UseNftsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type NftListParams = UseNftsParams & { include?: NftInclude };

/**
 * Create a `useNfts` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for NFT lists
 */
export function createUseNfts(
  queryFn: (params: NftListParams) => Promise<FetchNftsResult<PartialNft>>,
) {
  const impl = createUseList<NftListParams, PartialNft, FetchNftsResult<PartialNft>>({
    queryKey: (p) => nftKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.nfts,
  });

  function useNfts<const I extends NftInclude>(
    params: UseNftsParams & { include: I },
  ): UseNftsReturn<NftResult<I>>;
  function useNfts(
    params?: Omit<UseNftsParams, 'include'> & { include?: never },
  ): UseNftsReturn<Nft>;
  function useNfts(params: UseNftsParams & { include?: NftInclude }): UseNftsReturn<PartialNft>;
  function useNfts(
    params: UseNftsParams & { include?: NftInclude } = {},
  ): UseNftsReturn<PartialNft> {
    const { items, ...rest } = impl(params);
    return { nfts: items, ...rest };
  }

  return useNfts;
}
