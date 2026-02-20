import type { OwnedAsset } from '@lsp-indexer/types';
import type { GetOwnedAssetQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';

/**
 * Raw Hasura owned asset type from the codegen-generated query result.
 *
 * This is the shape of a single `owned_asset` element returned by both
 * `GetOwnedAssetQuery` and `GetOwnedAssetsQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawOwnedAsset = GetOwnedAssetQuery['owned_asset'][number];

/**
 * Transform a raw Hasura owned asset response into a clean `OwnedAsset` type.
 *
 * Handles all edge cases:
 * - **`balance` → `bigint`:** Hasura returns `numeric` as a string; we convert
 *   with `BigInt()` for uint256 precision. This is safe because Hasura's numeric
 *   scalar serializes as a plain decimal integer string.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted relations become `null`.
 * - **Nested `digitalAsset`:** Parsed via `parseDigitalAsset` for full DA details.
 * - **Nested `universalProfile`:** Parsed via `parseProfile` for LSP3 profile data.
 * - **`tokenIdCount`:** Extracted from `tokenIds_aggregate.aggregate.count`.
 *
 * @param raw - A single owned_asset from the Hasura GraphQL response
 * @returns A clean, camelCase `OwnedAsset` with bigint balance
 */
export function parseOwnedAsset(raw: RawOwnedAsset): OwnedAsset {
  return {
    id: raw.id,
    address: raw.address,
    owner: raw.owner,
    balance: BigInt(raw.balance),
    block: raw.block,
    timestamp: raw.timestamp,
    // Cast needed: the owned_asset document selects a subset of digital_asset fields;
    // parseDigitalAsset uses optional chaining and handles missing fields gracefully.
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset as any) : null,
    // Cast needed: the owned_asset document selects a subset of universal_profile fields
    // (no `id`); parseProfile uses optional chaining and handles missing fields gracefully.
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile as any) : null,
    tokenIdCount: raw.tokenIds_aggregate?.aggregate?.count ?? null,
  };
}

/**
 * Transform an array of raw Hasura owned asset responses into clean `OwnedAsset[]`.
 *
 * Convenience wrapper around `parseOwnedAsset` for batch results.
 *
 * @param raw - Array of owned_asset from the Hasura GraphQL response
 * @returns Array of clean, camelCase `OwnedAsset` objects with bigint balances
 */
export function parseOwnedAssets(raw: RawOwnedAsset[]): OwnedAsset[] {
  return raw.map(parseOwnedAsset);
}
