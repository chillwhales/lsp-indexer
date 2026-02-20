import type { DigitalAsset, TokenType } from '@lsp-indexer/types';
import type { GetDigitalAssetQuery } from '../graphql/graphql';
import { numericToString, parseAttributes, parseImage, parseLinks } from './utils';

/**
 * Raw Hasura digital asset type from the codegen-generated query result.
 *
 * This is the shape of a single `digital_asset` element returned by
 * both `GetDigitalAssetQuery` and `GetDigitalAssetsQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawDigitalAsset = GetDigitalAssetQuery['digital_asset'][number];

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
 * @param raw - A single digital_asset from the Hasura GraphQL response
 * @returns A clean, camelCase `DigitalAsset` with safe defaults
 */
export function parseDigitalAsset(raw: RawDigitalAsset): DigitalAsset {
  // Derive standard from presence of decimals field
  // decimals being undefined means the field was not included in the query
  // decimals being null means it was included but not set (→ LSP8)
  // decimals having a value means it was included and set (→ LSP7)
  let standard: DigitalAsset['standard'] = null;
  if (raw.decimals !== undefined) {
    standard = raw.decimals !== null ? 'LSP7' : 'LSP8';
  }

  const lsp4 = raw.lsp4Metadata;

  return {
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
    images: lsp4?.images != null ? lsp4.images.map(parseImage) : null,
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
}

/**
 * Transform an array of raw Hasura digital asset responses into clean `DigitalAsset[]`.
 *
 * Convenience wrapper around `parseDigitalAsset` for batch results.
 *
 * @param raw - Array of digital_asset from the Hasura GraphQL response
 * @returns Array of clean, camelCase `DigitalAsset` objects
 */
export function parseDigitalAssets(raw: RawDigitalAsset[]): DigitalAsset[] {
  return raw.map(parseDigitalAsset);
}
