import type { OwnedAsset, OwnedAssetInclude } from '@lsp-indexer/types';
import type { GetOwnedAssetQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

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
 * - **Field renames:** Hasura `address` → `digitalAssetAddress`, `owner` → `holderAddress`,
 *   `universalProfile` → `holder` for developer clarity.
 * - **`balance` → `bigint`:** Hasura returns `numeric` as a string; we convert
 *   with `BigInt()` for uint256 precision. Nullable when excluded via `@include`.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted relations/fields become `null`.
 * - **Nested `digitalAsset`:** Parsed via `parseDigitalAsset` for full DA details.
 * - **Nested `universalProfile` (→ `holder`):** Parsed via `parseProfile` for LSP3 profile data.
 * - **`tokenIdCount`:** Extracted from `tokenIds_aggregate.aggregate.count`.
 *
 * @param raw - A single owned_asset from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `OwnedAsset` with bigint balance (narrowed if include provided)
 */
export function parseOwnedAsset(raw: RawOwnedAsset, include?: OwnedAssetInclude): OwnedAsset {
  const result: OwnedAsset = {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    balance: raw.balance != null ? BigInt(raw.balance) : null,
    block: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    // Cast needed: the owned_asset document selects a subset of digital_asset fields;
    // parseDigitalAsset uses optional chaining and handles missing fields gracefully.
    // When include has digitalAsset sub-include, strip nested DA fields via parseDigitalAsset
    digitalAsset: raw.digitalAsset
      ? parseDigitalAsset(
          raw.digitalAsset as any,
          include?.digitalAsset && typeof include.digitalAsset === 'object'
            ? include.digitalAsset
            : undefined,
        )
      : null,
    // Cast needed: the owned_asset document selects a subset of universal_profile fields
    // (no `id`); parseProfile uses optional chaining and handles missing fields gracefully.
    // When include has holder sub-include, strip nested profile fields via parseProfile
    holder: raw.universalProfile
      ? parseProfile(
          raw.universalProfile as any,
          include?.holder && typeof include.holder === 'object' ? include.holder : undefined,
        )
      : null,
    tokenIdCount: raw.tokenIds_aggregate?.aggregate?.count ?? null,
  };

  return stripExcluded(result, include, ['id', 'digitalAssetAddress', 'holderAddress']);
}

/**
 * Transform an array of raw Hasura owned asset responses into clean `OwnedAsset[]`.
 *
 * Convenience wrapper around `parseOwnedAsset` for batch results.
 *
 * @param raw - Array of owned_asset from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseOwnedAsset` call
 * @returns Array of clean, camelCase `OwnedAsset` objects with bigint balances (narrowed if include provided)
 */
export function parseOwnedAssets(raw: RawOwnedAsset[], include?: OwnedAssetInclude): OwnedAsset[] {
  return raw.map((r) => parseOwnedAsset(r, include));
}
