/** @see createUseDetail */
import { nftKeys } from '@lsp-indexer/node';
import type { Nft, NftInclude, NftResult, PartialNft, UseNftParams } from '@lsp-indexer/types';
import type { UseNftReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type NftDetailParams = UseNftParams & { include?: NftInclude };

export function createUseNft(queryFn: (params: NftDetailParams) => Promise<PartialNft | null>) {
  const impl = createUseDetail<NftDetailParams, PartialNft>({
    queryKey: (p) => nftKeys.detail(p.address, p.tokenId, p.formattedTokenId, p.include),
    queryFn,
    enabled: (p) => Boolean(p.address && (p.tokenId || p.formattedTokenId)),
  });

  function useNft<const I extends NftInclude>(
    params: UseNftParams & { include: I },
  ): UseNftReturn<NftResult<I>>;
  function useNft(params: Omit<UseNftParams, 'include'> & { include?: never }): UseNftReturn<Nft>;
  function useNft(params: UseNftParams & { include?: NftInclude }): UseNftReturn<PartialNft>;
  function useNft(params: UseNftParams & { include?: NftInclude }): UseNftReturn<PartialNft> {
    const { data, ...rest } = impl(params);
    return { nft: data, ...rest };
  }

  return useNft;
}
