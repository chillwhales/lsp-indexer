import type { OwnedToken, OwnedTokenInclude, PartialOwnedToken } from '@lsp-indexer/types';
import type { GetOwnedTokenQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseNft } from './nfts';
import { parseOwnedAsset } from './owned-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura owned token type from the codegen-generated query result.
 *
 * This is the shape of a single `owned_token` element returned by both
 * `GetOwnedTokenQuery` and `GetOwnedTokensQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawOwnedToken = GetOwnedTokenQuery['owned_token'][number];

/**
 * Transform a raw Hasura owned token response into a clean `OwnedToken` type.
 *
 * Handles all edge cases:
 * - **Field renames:** Hasura `address` → `digitalAssetAddress`, `owner` → `holderAddress`,
 *   `universalProfile` → `holder` for developer clarity.
 * - **`token_id` → `tokenId`:** snake_case to camelCase mapping.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted relations/fields become `null`.
 * - **Nested `digitalAsset`:** Parsed via `parseDigitalAsset` for full DA details.
 * - **Nested `nft`:** Parsed via `parseNft` for NFT-specific fields (metadata, baseUri).
 * - **Nested `ownedAsset`:** Parsed via `parseOwnedAsset` for parent ownership record
 *   (basic fields only — no nested DA/profile/tokenIdCount in this context).
 * - **Nested `universalProfile` (→ `holder`):** Parsed via `parseProfile` for LSP3 profile data.
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `OwnedToken` (all fields guaranteed)
 * - With `include` → returns `PartialOwnedToken` (only base fields guaranteed, rest optional)
 *
 * @param raw - A single owned_token from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `OwnedToken` with all nested relations parsed (full or partial depending on include)
 */
export function parseOwnedToken(raw: RawOwnedToken): OwnedToken;
export function parseOwnedToken(raw: RawOwnedToken, include: OwnedTokenInclude): PartialOwnedToken;
export function parseOwnedToken(
  raw: RawOwnedToken,
  include?: OwnedTokenInclude,
): OwnedToken | PartialOwnedToken {
  const result: OwnedToken = {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    tokenId: raw.token_id,
    block: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    // The owned_token document selects a subset of digital_asset fields;
    // parseDigitalAsset uses optional chaining and handles missing fields gracefully.
    // Always parse as full type; outer stripExcluded controls field presence.
    digitalAsset: raw.digitalAsset
      ? parseDigitalAsset(raw.digitalAsset as Parameters<typeof parseDigitalAsset>[0])
      : null,
    // The owned_token nft sub-selection omits `id` and collection/holder;
    // parseNft uses optional chaining and handles missing fields gracefully.
    // Always parse as full type; outer stripExcluded controls field presence.
    nft: raw.nft ? parseNft(raw.nft as Parameters<typeof parseNft>[0]) : null,
    // The owned_token ownedAsset sub-selection has basic fields only
    // (no nested DA/profile/tokenIdCount); parseOwnedAsset handles missing fields.
    // Always parse as full type; outer stripExcluded controls field presence.
    ownedAsset: raw.ownedAsset
      ? parseOwnedAsset(raw.ownedAsset as Parameters<typeof parseOwnedAsset>[0])
      : null,
    // The owned_token document selects a subset of universal_profile fields
    // (no `id`); parseProfile uses optional chaining and handles missing fields gracefully.
    // Always parse as full type; outer stripExcluded controls field presence.
    holder: raw.universalProfile
      ? parseProfile(raw.universalProfile as Parameters<typeof parseProfile>[0])
      : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['id', 'digitalAssetAddress', 'holderAddress', 'tokenId']);
}

/**
 * Transform an array of raw Hasura owned token responses into clean `OwnedToken[]`.
 *
 * Convenience wrapper around `parseOwnedToken` for batch results.
 *
 * @param raw - Array of owned_token from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseOwnedToken` call
 * @returns Array of clean, camelCase `OwnedToken` objects (full or partial depending on include)
 */
export function parseOwnedTokens(raw: RawOwnedToken[]): OwnedToken[];
export function parseOwnedTokens(
  raw: RawOwnedToken[],
  include: OwnedTokenInclude,
): PartialOwnedToken[];
export function parseOwnedTokens(
  raw: RawOwnedToken[],
  include?: OwnedTokenInclude,
): (OwnedToken | PartialOwnedToken)[] {
  if (!include) return raw.map((r) => parseOwnedToken(r));
  return raw.map((r) => parseOwnedToken(r, include));
}
