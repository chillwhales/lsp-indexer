import type { OwnedAsset, OwnedAssetInclude, PartialOwnedAsset } from '@lsp-indexer/types';
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
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `OwnedAsset` (all fields guaranteed)
 * - With `include` → returns `PartialOwnedAsset` (only base fields guaranteed, rest optional)
 *
 * @param raw - A single owned_asset from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `OwnedAsset` with bigint balance (full or partial depending on include)
 */
export function parseOwnedAsset(raw: RawOwnedAsset): OwnedAsset;
export function parseOwnedAsset(raw: RawOwnedAsset, include: OwnedAssetInclude): PartialOwnedAsset;
export function parseOwnedAsset(
  raw: RawOwnedAsset,
  include?: OwnedAssetInclude,
): OwnedAsset | PartialOwnedAsset {
  const result: OwnedAsset = {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    balance: raw.balance != null ? BigInt(raw.balance) : null,
    block: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    // The owned_asset document selects a subset of digital_asset fields;
    // parseDigitalAsset uses optional chaining and handles missing fields gracefully.
    // Always parse as full DigitalAsset; outer stripExcluded controls field presence.
    digitalAsset: raw.digitalAsset
      ? parseDigitalAsset(raw.digitalAsset as Parameters<typeof parseDigitalAsset>[0])
      : null,
    // The owned_asset document selects a subset of universal_profile fields
    // (no `id`); parseProfile uses optional chaining and handles missing fields gracefully.
    // Always parse as full Profile; outer stripExcluded controls field presence.
    holder: raw.universalProfile
      ? parseProfile(raw.universalProfile as Parameters<typeof parseProfile>[0])
      : null,
    tokenIdCount: raw.tokenIds_aggregate?.aggregate?.count ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['id', 'digitalAssetAddress', 'holderAddress']);
}

/**
 * Transform an array of raw Hasura owned asset responses into clean `OwnedAsset[]`.
 *
 * Convenience wrapper around `parseOwnedAsset` for batch results.
 *
 * @param raw - Array of owned_asset from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseOwnedAsset` call
 * @returns Array of clean, camelCase `OwnedAsset` objects with bigint balances (full or partial depending on include)
 */
export function parseOwnedAssets(raw: RawOwnedAsset[]): OwnedAsset[];
export function parseOwnedAssets(
  raw: RawOwnedAsset[],
  include: OwnedAssetInclude,
): PartialOwnedAsset[];
export function parseOwnedAssets(
  raw: RawOwnedAsset[],
  include?: OwnedAssetInclude,
): (OwnedAsset | PartialOwnedAsset)[] {
  if (!include) return raw.map((r) => parseOwnedAsset(r));
  return raw.map((r) => parseOwnedAsset(r, include));
}
