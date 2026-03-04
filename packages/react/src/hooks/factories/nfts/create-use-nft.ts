/**
 * Factory for useNft — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseNft(queryFn)` with its own fetch function:
 * - React: `(p) => fetchNft(getClientUrl(), p)`
 * - Next:  `(p) => getNft(p.address, p.tokenId, p.formattedTokenId, p.include)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { nftKeys } from '@lsp-indexer/node';
import type { Nft, NftInclude, NftResult, PartialNft, UseNftParams } from '@lsp-indexer/types';
import type { UseNftReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — address + tokenId/formattedTokenId + optional include */
type NftDetailParams = UseNftParams & { include?: NftInclude };

/**
 * Create a `useNft` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for a single NFT
 */
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
