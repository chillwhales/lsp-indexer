import type { OwnedAsset, OwnedToken } from '@lsp-indexer/types';
import type { GetOwnedAssetsResult, GetOwnedTokensResult } from '../documents/owned-assets';

/**
 * Raw Hasura owned_asset type from the query result.
 */
type RawOwnedAsset = GetOwnedAssetsResult['owned_asset'][number];

/**
 * Raw Hasura owned_token type from the query result.
 */
type RawOwnedToken = GetOwnedTokensResult['owned_token'][number];

/**
 * Transform a raw Hasura owned_asset row into a clean `OwnedAsset` type.
 *
 * Field mapping:
 * - `owner` → `ownerAddress` (UP address of the owner)
 * - `address` → `assetAddress` (token contract address)
 * - `balance` → `balance` (kept as string for large numbers)
 * - `digitalAsset.lsp4TokenName.value` → `name`
 * - `digitalAsset.lsp4TokenSymbol.value` → `symbol`
 *
 * @param raw - A single owned_asset from the Hasura GraphQL response
 * @returns A clean, camelCase `OwnedAsset` with semantic field names
 */
export function parseOwnedAsset(raw: RawOwnedAsset): OwnedAsset {
  return {
    ownerAddress: raw.owner,
    assetAddress: raw.address,
    balance: raw.balance ?? null,
    name: raw.digitalAsset?.lsp4TokenName?.value ?? null,
    symbol: raw.digitalAsset?.lsp4TokenSymbol?.value ?? null,
  };
}

/**
 * Transform an array of raw Hasura owned_asset rows into clean `OwnedAsset[]`.
 *
 * Convenience wrapper around `parseOwnedAsset` for batch results.
 *
 * @param raw - Array of owned_asset from the Hasura GraphQL response
 * @returns Array of clean, camelCase `OwnedAsset` objects
 */
export function parseOwnedAssets(raw: RawOwnedAsset[]): OwnedAsset[] {
  return raw.map(parseOwnedAsset);
}

/**
 * Transform a raw Hasura owned_token row into a clean `OwnedToken` type.
 *
 * Field mapping:
 * - `owner` → `ownerAddress` (UP address of the owner)
 * - `address` → `assetAddress` (collection contract address)
 * - `token_id` → `tokenId` (specific token ID within the collection)
 * - `digitalAsset.lsp4TokenName.value` → `name`
 * - `digitalAsset.lsp4TokenSymbol.value` → `symbol`
 *
 * @param raw - A single owned_token from the Hasura GraphQL response
 * @returns A clean, camelCase `OwnedToken` with semantic field names
 */
export function parseOwnedToken(raw: RawOwnedToken): OwnedToken {
  return {
    ownerAddress: raw.owner,
    assetAddress: raw.address,
    tokenId: raw.token_id,
    name: raw.digitalAsset?.lsp4TokenName?.value ?? null,
    symbol: raw.digitalAsset?.lsp4TokenSymbol?.value ?? null,
  };
}

/**
 * Transform an array of raw Hasura owned_token rows into clean `OwnedToken[]`.
 *
 * Convenience wrapper around `parseOwnedToken` for batch results.
 *
 * @param raw - Array of owned_token from the Hasura GraphQL response
 * @returns Array of clean, camelCase `OwnedToken` objects
 */
export function parseOwnedTokens(raw: RawOwnedToken[]): OwnedToken[] {
  return raw.map(parseOwnedToken);
}
