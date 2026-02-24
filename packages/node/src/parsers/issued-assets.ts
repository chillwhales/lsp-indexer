import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
} from '@lsp-indexer/types';
import type { GetIssuedAssetsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura issued asset type from the codegen-generated query result.
 *
 * Uses the array element type from `GetIssuedAssetsQuery['lsp12_issued_asset']`.
 * Unlike Creator which omits `__typename`, we use the full type since the document
 * doesn't select `id` at the top level (only `address` and `asset_address` as base fields).
 */
type RawIssuedAsset = GetIssuedAssetsQuery['lsp12_issued_asset'][number];

/**
 * Transform a raw Hasura lsp12_issued_asset response into a clean `IssuedAsset` type.
 *
 * Handles all field mappings:
 * - `address` (Hasura) → `issuerAddress` (NOT `raw.issuer_address` — Hasura field is just `address`)
 * - `asset_address` → `assetAddress`
 * - `array_index` (numeric/string) → `arrayIndex` (number | null) via Number()
 * - `interface_id` → `interfaceId`
 * - `timestamp` → `timestamp` (stringified)
 * - `universalProfile` (Hasura) → `issuerProfile` (our domain type) via `parseProfile` with sub-include
 * - `issuedAsset` (Hasura) → `digitalAsset` (our domain type) via `parseDigitalAsset` with sub-include
 * - `@include(if: false)` omitted fields won't be present — uses optional chaining
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Profile and digital asset sub-includes are passed through to their respective
 * parsers for recursive nested stripping.
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `IssuedAsset` (all fields guaranteed)
 * - With `<const I>` → returns `IssuedAssetResult<I>` (narrowed by include)
 * - With optional `include` → returns `PartialIssuedAsset`
 *
 * @param raw - A single lsp12_issued_asset from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `IssuedAsset` (full or partial depending on include)
 */
export function parseIssuedAsset(raw: RawIssuedAsset): IssuedAsset;
export function parseIssuedAsset<const I extends IssuedAssetInclude>(
  raw: RawIssuedAsset,
  include: I,
): IssuedAssetResult<I>;
export function parseIssuedAsset(
  raw: RawIssuedAsset,
  include?: IssuedAssetInclude,
): IssuedAsset | PartialIssuedAsset;
export function parseIssuedAsset(
  raw: RawIssuedAsset,
  include?: IssuedAssetInclude,
): IssuedAsset | PartialIssuedAsset {
  const result: IssuedAsset = {
    issuerAddress: raw.address,
    assetAddress: raw.asset_address,
    arrayIndex: raw.array_index != null ? Number(raw.array_index) : null,
    interfaceId: raw.interface_id ?? null,
    timestamp: raw.timestamp != null ? String(raw.timestamp) : null,
    issuerProfile: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
    digitalAsset: raw.issuedAsset ? parseDigitalAsset(raw.issuedAsset) : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['issuerAddress', 'assetAddress'], undefined, {
    issuerProfile: { baseFields: ['address'] },
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
  });
}

/**
 * Transform an array of raw Hasura lsp12_issued_asset responses into clean `IssuedAsset[]`.
 *
 * Convenience wrapper around `parseIssuedAsset` for batch results.
 *
 * @param raw - Array of lsp12_issued_asset from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseIssuedAsset` call
 * @returns Array of clean, camelCase `IssuedAsset` objects (full or partial depending on include)
 */
export function parseIssuedAssets(raw: RawIssuedAsset[]): IssuedAsset[];
export function parseIssuedAssets<const I extends IssuedAssetInclude>(
  raw: RawIssuedAsset[],
  include: I,
): IssuedAssetResult<I>[];
export function parseIssuedAssets(
  raw: RawIssuedAsset[],
  include?: IssuedAssetInclude,
): (IssuedAsset | PartialIssuedAsset)[] {
  if (include) return raw.map((r) => parseIssuedAsset(r, include));
  return raw.map((r) => parseIssuedAsset(r));
}
