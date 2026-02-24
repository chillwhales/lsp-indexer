import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  TokenType,
} from '@lsp-indexer/types';
import type { GetDigitalAssetQuery } from '../graphql/graphql';
import { stripExcluded } from './strip';
import { numericToString, parseAttributes, parseImage, parseImages, parseLinks } from './utils';

/**
 * Raw Hasura digital asset type from the codegen-generated query result.
 *
 * Uses `Omit<..., 'id'>` because the parser never reads `id` — it only needs
 * `address` and metadata fields. This allows the same parser to accept both
 * primary query results (which include `id`) and sub-selections from other
 * domains (nfts, owned-assets, owned-tokens) which may not select `id`.
 * TypeScript structural subtyping means types WITH `id` still satisfy this.
 */
type RawDigitalAsset = Omit<GetDigitalAssetQuery['digital_asset'][number], 'id'>;

/**
 * Validate and return a raw Hasura tokenType string as a clean TokenType.
 *
 * The indexer stores the decoded string value directly:
 * - `"TOKEN"` — fungible token (LSP4 tokenType 0)
 * - `"NFT"` — non-fungible token (LSP4 tokenType 1)
 * - `"COLLECTION"` — collection of NFTs (LSP4 tokenType 2)
 *
 * Returns `null` if the value is absent or unrecognized.
 */
function mapTokenType(raw: string | null | undefined): TokenType | null {
  if (raw === 'TOKEN' || raw === 'NFT' || raw === 'COLLECTION') return raw;
  return null;
}

/**
 * Transform a raw Hasura digital asset response into a clean `DigitalAsset` type.
 *
 * Handles all edge cases:
 * - `@include(if: false)` omitted fields won't be present in the response —
 *   uses optional chaining; omitted arrays become `null`, included-but-empty arrays become `[]`
 * - `decimals` presence is used to derive `standard` (LSP7 when present, LSP8 when absent)
 * - Raw tokenType string values ("TOKEN"/"NFT"/"COLLECTION") are validated and passed through
 * - Aggregate counts may have `null` aggregate — defaults to `null`
 * - Owner field may be omitted if not included
 *
 * **Standard derivation (LOCKED):**
 * - If `decimals` has a value → `"LSP7"` (only LSP7 contracts have decimals)
 * - If `decimals` is null/undefined → `"LSP8"`
 * - When decimals is not included at all (undefined), standard is `null`
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `DigitalAsset` (all fields guaranteed)
 * - With `include` → returns `PartialDigitalAsset` (only `address` guaranteed, rest optional)
 *
 * @param raw - A single digital_asset from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `DigitalAsset` (full or partial depending on include)
 */
export function parseDigitalAsset(raw: RawDigitalAsset): DigitalAsset;
export function parseDigitalAsset<const I extends DigitalAssetInclude>(
  raw: RawDigitalAsset,
  include: I,
): DigitalAssetResult<I>;
export function parseDigitalAsset(
  raw: RawDigitalAsset,
  include?: DigitalAssetInclude,
): DigitalAsset | PartialDigitalAsset {
  // Derive standard from presence of decimals field
  // decimals being undefined means the field was not included in the query
  // decimals being null means it was included but not set (→ LSP8)
  // decimals having a value means it was included and set (→ LSP7)
  let standard: DigitalAsset['standard'] = null;
  if (raw.decimals !== undefined) {
    standard = raw.decimals !== null ? 'LSP7' : 'LSP8';
  }

  const lsp4 = raw.lsp4Metadata;

  const result: DigitalAsset = {
    address: raw.address,
    standard,
    name: raw.lsp4TokenName?.value ?? null,
    symbol: raw.lsp4TokenSymbol?.value ?? null,
    tokenType: mapTokenType(raw.lsp4TokenType?.value),
    decimals: raw.decimals?.value ?? null,
    totalSupply: raw.totalSupply?.value != null ? numericToString(raw.totalSupply.value) : null,
    description: lsp4?.description?.value ?? null,
    category: lsp4?.category?.value ?? null,
    icons: lsp4?.icon != null ? lsp4.icon.map(parseImage) : null,
    images: parseImages(lsp4?.images),
    links: parseLinks(lsp4?.links),
    attributes: parseAttributes(lsp4?.attributes),
    owner:
      raw.owner != null
        ? {
            address: raw.owner.address,
            timestamp: String(raw.owner.timestamp),
          }
        : null,
    holderCount: raw.ownedAssets_aggregate?.aggregate?.count ?? null,
    creatorCount:
      raw.lsp4CreatorsLength?.value != null ? Number(raw.lsp4CreatorsLength.value) : null,
    referenceContract: raw.lsp8ReferenceContract?.value ?? null,
    tokenIdFormat: raw.lsp8TokenIdFormat?.value ?? null,
    baseUri: raw.lsp8TokenMetadataBaseUri?.value ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address'], { standard: 'decimals' });
}

/**
 * Transform an array of raw Hasura digital asset responses into clean `DigitalAsset[]`.
 *
 * Convenience wrapper around `parseDigitalAsset` for batch results.
 *
 * @param raw - Array of digital_asset from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseDigitalAsset` call
 * @returns Array of clean, camelCase `DigitalAsset` objects (full or partial depending on include)
 */
export function parseDigitalAssets(raw: RawDigitalAsset[]): DigitalAsset[];
export function parseDigitalAssets<const I extends DigitalAssetInclude>(
  raw: RawDigitalAsset[],
  include: I,
): DigitalAssetResult<I>[];
export function parseDigitalAssets(
  raw: RawDigitalAsset[],
  include?: DigitalAssetInclude,
): (DigitalAsset | PartialDigitalAsset)[] {
  if (!include) return raw.map((r) => parseDigitalAsset(r));
  return raw.map((r) => parseDigitalAsset(r, include));
}
