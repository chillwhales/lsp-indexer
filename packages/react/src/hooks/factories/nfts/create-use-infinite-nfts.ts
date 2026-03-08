/** @see createUseInfinite */
import { type FetchNftsResult, nftKeys } from '@lsp-indexer/node';
import {
  type Nft,
  type NftInclude,
  type NftResult,
  type PartialNft,
  type UseInfiniteNftsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteNftsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type NftInfiniteParams = UseInfiniteNftsParams & { include?: NftInclude };

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
