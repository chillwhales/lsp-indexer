'use server';

import { type FetchNftsResult, fetchNft, fetchNfts, getServerUrl } from '@lsp-indexer/node';
import {
  type Nft,
  type NftFilter,
  type NftInclude,
  type NftResult,
  type NftSort,
  type PartialNft,
  UseNftParamsSchema,
  UseNftsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a single NFT by address and token ID. */
export async function getNft(params: {
  address: string;
  tokenId?: string;
  formattedTokenId?: string;
}): Promise<Nft | null>;
export async function getNft<const I extends NftInclude>(params: {
  address: string;
  tokenId?: string;
  formattedTokenId?: string;
  include: I;
}): Promise<NftResult<I> | null>;
export async function getNft(params: {
  address: string;
  tokenId?: string;
  formattedTokenId?: string;
  include?: NftInclude;
}): Promise<PartialNft | null>;
export async function getNft(params: {
  address: string;
  tokenId?: string;
  formattedTokenId?: string;
  include?: NftInclude;
}): Promise<PartialNft | null> {
  validateInput(UseNftParamsSchema, params, 'getNft');
  return await fetchNft(getServerUrl(), params);
}

/** Server action: fetch a paginated list of NFTs. */
export async function getNfts(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
}): Promise<FetchNftsResult>;
export async function getNfts<const I extends NftInclude>(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchNftsResult<NftResult<I>>>;
export async function getNfts(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
  include?: NftInclude;
}): Promise<FetchNftsResult<PartialNft>>;
export async function getNfts(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
  include?: NftInclude;
}): Promise<FetchNftsResult<PartialNft>> {
  if (params) validateInput(UseNftsParamsSchema, params, 'getNfts');
  return await fetchNfts(getServerUrl(), params);
}
