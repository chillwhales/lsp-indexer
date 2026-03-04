/**
 * Factory for useInfiniteNfts — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteNfts(queryFn)` with its own fetch:
 * - React: `(p) => fetchNfts(getClientUrl(), p)`
 * - Next:  `(p) => getNfts(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchNftsResult } from '@lsp-indexer/node';
import { nftKeys } from '@lsp-indexer/node';
import type {
  Nft,
  NftInclude,
  NftResult,
  PartialNft,
  UseInfiniteNftsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteNftsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteNftsParams with optional include */
type NftInfiniteParams = UseInfiniteNftsParams & { include?: NftInclude };

/**
 * Create a `useInfiniteNfts` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for NFT lists (with limit + offset)
 */
export function createUseInfiniteNfts(
  queryFn: (
    params: NftInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchNftsResult<PartialNft>>,
) {
  const impl = createUseInfinite<NftInfiniteParams, PartialNft, FetchNftsResult<PartialNft>>({
    queryKey: (p) => nftKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.nfts,
  });

  function useInfiniteNfts<const I extends NftInclude>(
    params: UseInfiniteNftsParams & { include: I },
  ): UseInfiniteNftsReturn<NftResult<I>>;
  function useInfiniteNfts(
    params?: Omit<UseInfiniteNftsParams, 'include'> & { include?: never },
  ): UseInfiniteNftsReturn<Nft>;
  function useInfiniteNfts(
    params: UseInfiniteNftsParams & { include?: NftInclude },
  ): UseInfiniteNftsReturn<PartialNft>;
  function useInfiniteNfts(
    params: UseInfiniteNftsParams & { include?: NftInclude } = {},
  ): UseInfiniteNftsReturn<PartialNft> {
    const { items, ...rest } = impl(params);
    return { nfts: items, ...rest };
  }

  return useInfiniteNfts;
}
