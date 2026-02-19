import type { Nft } from '@lsp-indexer/types';
import type { GetNftQueryResult } from '../documents/nfts';

/**
 * Raw Hasura NFT type from the query result.
 *
 * This is the shape of a single `nft` element returned by both
 * `GetNftQueryResult` and `GetNftsQueryResult`.
 */
type RawNft = GetNftQueryResult['nft'][number];

/**
 * Transform a raw Hasura NFT response into a clean `Nft` type.
 *
 * Handles all edge cases:
 * - `digitalAsset` may be `null` (no metadata linked)
 * - `ownedToken` may be `null` (token not currently owned)
 * - Nested name/symbol/baseUri objects use optional chaining with `null` defaults
 *
 * @param raw - A single nft from the Hasura GraphQL response
 * @returns A clean, camelCase `Nft` with safe defaults
 */
export function parseNft(raw: RawNft): Nft {
  const asset = raw.digitalAsset;

  return {
    address: raw.address,
    tokenId: raw.token_id,
    tokenIdFormat: raw.formatted_token_id ?? null,
    isBurned: raw.is_burned,
    isMinted: raw.is_minted,
    name: asset?.lsp4TokenName?.value ?? null,
    symbol: asset?.lsp4TokenSymbol?.value ?? null,
    baseUri: asset?.lsp8TokenMetadataBaseUri?.value ?? null,
    ownerAddress: raw.ownedToken?.owner ?? null,
  };
}

/**
 * Transform an array of raw Hasura NFT responses into clean `Nft[]`.
 *
 * Convenience wrapper around `parseNft` for batch results.
 *
 * @param raw - Array of nft from the Hasura GraphQL response
 * @returns Array of clean, camelCase `Nft` objects
 */
export function parseNfts(raw: RawNft[]): Nft[] {
  return raw.map(parseNft);
}
