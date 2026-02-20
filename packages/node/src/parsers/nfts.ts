import type { Nft } from '@lsp-indexer/types';
import type { GetNftQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseImage } from './utils';

/**
 * Raw Hasura NFT type from the codegen-generated query result.
 *
 * This is the shape of a single `nft` element returned by both
 * `GetNftQuery` and `GetNftsQuery`. We extract it from the codegen type
 * to keep the parser type-safe against schema changes.
 */
type RawNft = GetNftQuery['nft'][number];

// ---------------------------------------------------------------------------
// Small DRY helpers for repeated metadata patterns
// ---------------------------------------------------------------------------

/**
 * Parse an array of link objects from metadata.
 * Returns `null` if the input is nullish (field not included or metadata absent).
 */
function parseLinks(
  links: ReadonlyArray<{ title?: string | null; url?: string | null }> | null | undefined,
) {
  if (!links) return null;
  return links.map((l) => ({ title: l.title ?? '', url: l.url ?? '' }));
}

/**
 * Parse an array of attribute objects from metadata.
 * Returns `null` if the input is nullish (field not included or metadata absent).
 */
function parseAttributes(
  attrs:
    | ReadonlyArray<{ key?: string | null; value?: string | null; type?: string | null }>
    | null
    | undefined,
) {
  if (!attrs) return null;
  return attrs.map((a) => ({ key: a.key ?? '', value: a.value ?? '', type: a.type ?? '' }));
}

/**
 * Transform a raw Hasura NFT response into a clean `Nft` type.
 *
 * Handles all edge cases:
 * - **BaseUri fallback:** For each metadata field, checks direct `lsp4Metadata` first,
 *   falls back to `lsp4MetadataBaseUri`, then `null`. Only returns null if BOTH are absent.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted arrays become `null`, included-but-empty arrays become `[]`.
 * - **Holder mapping:** Maps `ownedToken.owner` (address string) and
 *   `ownedToken.timestamp` to a clean `{ address, timestamp }` holder object.
 * - **Collection info:** Full DigitalAsset from digitalAsset relation, parsed via `parseDigitalAsset`.
 * - **Name field:** NFT's own name from `lsp4Metadata.name` with baseUri fallback.
 *
 * **Array field convention (T[] | null):**
 * - `null` = field not included in query OR metadata absent
 * - `[]` = fetched but legitimately empty
 *
 * @param raw - A single nft from the Hasura GraphQL response
 * @returns A clean, camelCase `Nft` with safe defaults
 */
export function parseNft(raw: RawNft): Nft {
  const direct = raw.lsp4Metadata;
  const baseUri = raw.lsp4MetadataBaseUri;

  return {
    address: raw.address,
    tokenId: raw.token_id,
    formattedTokenId: raw.formatted_token_id ?? null,
    isBurned: raw.is_burned,
    isMinted: raw.is_minted,

    // NFT's own name: direct metadata first, baseUri fallback
    name: direct?.name?.value ?? baseUri?.name?.value ?? null,

    // Full collection from digitalAsset — reuse parseDigitalAsset
    collection: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,

    // Holder (not owner — ownedToken tracks the token holder)
    holder: raw.ownedToken
      ? { address: raw.ownedToken.owner, timestamp: raw.ownedToken.timestamp ?? '' }
      : null,

    // All metadata fields: direct first, baseUri fallback
    description: direct?.description?.value ?? baseUri?.description?.value ?? null,
    category: direct?.category?.value ?? baseUri?.category?.value ?? null,
    icons: direct?.icon
      ? direct.icon.map(parseImage)
      : baseUri?.icon
        ? baseUri.icon.map(parseImage)
        : null,
    images: direct?.images
      ? direct.images.map(parseImage)
      : baseUri?.images
        ? baseUri.images.map(parseImage)
        : null,
    links: parseLinks(direct?.links) ?? parseLinks(baseUri?.links) ?? null,
    attributes: parseAttributes(direct?.attributes) ?? parseAttributes(baseUri?.attributes) ?? null,
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
