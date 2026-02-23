import type { Creator, CreatorInclude, CreatorResult, PartialCreator } from '@lsp-indexer/types';
import type { GetCreatorsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura creator type from the codegen-generated query result.
 *
 * Uses `Omit<..., 'id'>` because the parser never reads `id` — it only needs
 * `creator_address`, `address`, and relation fields. This allows the same parser
 * to accept both primary query results (which include `id`) and sub-selections
 * from other domains which may not select `id`.
 * TypeScript structural subtyping means types WITH `id` still satisfy this.
 */
type RawCreator = Omit<GetCreatorsQuery['lsp4_creator'][number], '__typename'>;

/**
 * Transform a raw Hasura lsp4_creator response into a clean `Creator` type.
 *
 * Handles all field mappings:
 * - `creator_address` → `creatorAddress`
 * - `address` → `digitalAssetAddress`
 * - `array_index` (numeric/string) → `arrayIndex` (number | null) via Number()
 * - `interface_id` → `interfaceId`
 * - `timestamp` → `timestamp` (stringified)
 * - `creatorProfile` parsed via `parseProfile` with sub-include
 * - `digitalAsset` parsed via `parseDigitalAsset` with sub-include
 * - `@include(if: false)` omitted fields won't be present — uses optional chaining
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Profile and digital asset sub-includes are passed through to their respective
 * parsers for recursive nested stripping.
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `Creator` (all fields guaranteed)
 * - With `<const I>` → returns `CreatorResult<I>` (narrowed by include)
 * - With optional `include` → returns `PartialCreator`
 *
 * @param raw - A single lsp4_creator from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `Creator` (full or partial depending on include)
 */
export function parseCreator(raw: RawCreator): Creator;
export function parseCreator<const I extends CreatorInclude>(
  raw: RawCreator,
  include: I,
): CreatorResult<I>;
export function parseCreator(raw: RawCreator, include?: CreatorInclude): Creator | PartialCreator;
export function parseCreator(raw: RawCreator, include?: CreatorInclude): Creator | PartialCreator {
  const result: Creator = {
    creatorAddress: raw.creator_address,
    digitalAssetAddress: raw.address,
    arrayIndex: raw.array_index != null ? Number(raw.array_index) : null,
    interfaceId: raw.interface_id ?? null,
    timestamp: raw.timestamp != null ? String(raw.timestamp) : null,
    creatorProfile: raw.creatorProfile
      ? parseProfile(raw.creatorProfile as Parameters<typeof parseProfile>[0])
      : null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['creatorAddress', 'digitalAssetAddress'], undefined, {
    creatorProfile: { baseFields: ['address'] },
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
  });
}

/**
 * Transform an array of raw Hasura lsp4_creator responses into clean `Creator[]`.
 *
 * Convenience wrapper around `parseCreator` for batch results.
 *
 * @param raw - Array of lsp4_creator from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseCreator` call
 * @returns Array of clean, camelCase `Creator` objects (full or partial depending on include)
 */
export function parseCreators(raw: RawCreator[]): Creator[];
export function parseCreators<const I extends CreatorInclude>(
  raw: RawCreator[],
  include: I,
): CreatorResult<I>[];
export function parseCreators(
  raw: RawCreator[],
  include?: CreatorInclude,
): (Creator | PartialCreator)[] {
  if (include) return raw.map((r) => parseCreator(r, include));
  return raw.map((r) => parseCreator(r));
}
