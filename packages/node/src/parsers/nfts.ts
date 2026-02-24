import type { Nft, NftInclude, NftResult, PartialNft } from '@lsp-indexer/types';
import type { GetNftQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { parseAttributes, parseImage, parseImages, parseLinks } from './utils';

/**
 * Raw Hasura NFT type from the codegen-generated query result.
 *
 * Uses `Omit<..., 'id'>` because the parser never reads `id` — it only needs
 * `address`, `token_id`, and metadata fields. This allows the same parser
 * to accept both primary query results (which include `id`) and sub-selections
 * from owned-tokens (which don't select `id`).
 * TypeScript structural subtyping means types WITH `id` still satisfy this.
 */
type RawNft = Omit<GetNftQuery['nft'][number], 'id'>;

/**
 * Transform a raw Hasura NFT response into a clean `Nft` type.
 *
 * Handles all edge cases:
 * - **BaseUri fallback:** For each metadata field, checks direct `lsp4Metadata` first,
 *   falls back to `lsp4MetadataBaseUri`, then `null`. Only returns null if BOTH are absent.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted arrays become `null`, included-but-empty arrays become `[]`.
 * - **Holder mapping:** Spreads profile fields flat into holder (no nested
 *   `universalProfile` wrapper). When holder has no UP, profile fields get safe defaults.
 * - **Collection info:** Full DigitalAsset from digitalAsset relation, parsed via `parseDigitalAsset`.
 * - **Name field:** NFT's own name from `lsp4Metadata.name` with baseUri fallback.
 *
 * **Array field convention (T[] | null):**
 * - `null` = field not included in query OR metadata absent
 * - `[]` = fetched but legitimately empty
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `Nft` (all fields guaranteed)
 * - With `include` → returns `PartialNft` (only base fields guaranteed, rest optional)
 *
 * @param raw - A single nft from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `Nft` (full or partial depending on include)
 */
export function parseNft(raw: RawNft): Nft;
export function parseNft<const I extends NftInclude>(raw: RawNft, include: I): NftResult<I>;
export function parseNft(raw: RawNft, include?: NftInclude): Nft | PartialNft {
  const direct = raw.lsp4Metadata;
  const baseUri = raw.lsp4MetadataBaseUri;

  const result: Nft = {
    address: raw.address,
    tokenId: raw.token_id,
    formattedTokenId: raw.formatted_token_id ?? null,
    isBurned: raw.is_burned,
    isMinted: raw.is_minted,

    // NFT's own name: direct metadata first, baseUri fallback
    name: direct?.name?.value ?? baseUri?.name?.value ?? null,

    // Full collection from digitalAsset — reuse parseDigitalAsset.
    // Always parse as full DigitalAsset; outer stripExcluded controls field presence.
    collection: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,

    // Holder — profile fields spread flat (no nested universalProfile wrapper).
    // When the holder has a UP, profile fields are populated from parseProfile.
    // When no UP exists, profile fields get safe defaults (null / 0 / []).
    // Always parse as full Profile; outer stripExcluded controls field presence.
    holder: raw.ownedToken
      ? {
          timestamp: raw.ownedToken.timestamp ?? '',
          ...(raw.ownedToken.universalProfile
            ? parseProfile(raw.ownedToken.universalProfile)
            : {
                address: raw.ownedToken.owner,
                name: null,
                description: null,
                tags: null,
                links: null,
                avatar: null,
                profileImage: null,
                backgroundImage: null,
                followerCount: 0,
                followingCount: 0,
              }),
        }
      : null,

    // All metadata fields: direct first, baseUri fallback
    description: direct?.description?.value ?? baseUri?.description?.value ?? null,
    category: direct?.category?.value ?? baseUri?.category?.value ?? null,
    icons: direct?.icon
      ? direct.icon.map(parseImage)
      : baseUri?.icon
        ? baseUri.icon.map(parseImage)
        : null,
    images: parseImages(direct?.images) ?? parseImages(baseUri?.images),
    links: parseLinks(direct?.links) ?? parseLinks(baseUri?.links) ?? null,
    attributes: parseAttributes(direct?.attributes) ?? parseAttributes(baseUri?.attributes) ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address', 'tokenId', 'isBurned', 'isMinted'], undefined, {
    collection: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
    holder: { baseFields: ['address', 'timestamp'] },
  });
}

/**
 * Transform an array of raw Hasura NFT responses into clean `Nft[]`.
 *
 * Convenience wrapper around `parseNft` for batch results.
 *
 * @param raw - Array of nft from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseNft` call
 * @returns Array of clean, camelCase `Nft` objects (full or partial depending on include)
 */
export function parseNfts(raw: RawNft[]): Nft[];
export function parseNfts<const I extends NftInclude>(raw: RawNft[], include: I): NftResult<I>[];
export function parseNfts(raw: RawNft[], include?: NftInclude): (Nft | PartialNft)[] {
  if (!include) return raw.map((r) => parseNft(r));
  return raw.map((r) => parseNft(r, include));
}
