import type { DigitalAsset } from '@lsp-indexer/types';
import type { GetDigitalAssetQuery } from '../graphql/graphql';

/**
 * Raw Hasura digital asset type from the codegen-generated query result.
 *
 * This is the shape of a single `digital_asset` element returned by
 * both `GetDigitalAssetQuery` and `GetDigitalAssetsQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawDigitalAsset = GetDigitalAssetQuery['digital_asset'][number];

/**
 * Transform a raw Hasura Digital Asset response into a clean `DigitalAsset` type.
 *
 * Handles all edge cases:
 * - `lsp4TokenName`, `lsp4TokenSymbol`, `lsp4TokenType` may be `null` (no metadata set)
 * - `totalSupply` may be `null`
 * - Aggregate counts may have `null` aggregate — defaults to `0`
 *
 * @param raw - A single digital_asset from the Hasura GraphQL response
 * @returns A clean, camelCase `DigitalAsset` with safe defaults
 */
export function parseDigitalAsset(raw: RawDigitalAsset): DigitalAsset {
  return {
    address: raw.address,
    name: raw.lsp4TokenName?.value ?? null,
    symbol: raw.lsp4TokenSymbol?.value ?? null,
    tokenType: raw.lsp4TokenType?.value ?? null,
    totalSupply: raw.totalSupply?.value != null ? String(raw.totalSupply.value) : null,
    creatorCount: raw.lsp4Creators_aggregate?.aggregate?.count ?? 0,
    holderCount: raw.ownedTokens_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Transform an array of raw Hasura Digital Asset responses into clean `DigitalAsset[]`.
 *
 * Convenience wrapper around `parseDigitalAsset` for batch results.
 *
 * @param raw - Array of digital_asset from the Hasura GraphQL response
 * @returns Array of clean, camelCase `DigitalAsset` objects
 */
export function parseDigitalAssets(raw: RawDigitalAsset[]): DigitalAsset[] {
  return raw.map(parseDigitalAsset);
}
