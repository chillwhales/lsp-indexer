/** @see createUseList */
import { type FetchNftsResult, nftKeys } from '@lsp-indexer/node';
import {
  type Nft,
  type NftInclude,
  type NftResult,
  type PartialNft,
  type UseNftsParams,
} from '@lsp-indexer/types';
import { type UseNftsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type NftListParams = UseNftsParams & { include?: NftInclude };

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
