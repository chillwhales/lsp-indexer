import type { OwnedToken } from '@lsp-indexer/types';
import type { GetOwnedTokenQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseNft } from './nfts';
import { parseOwnedAsset } from './owned-assets';
import { parseProfile } from './profiles';

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
 * @param raw - A single owned_token from the Hasura GraphQL response
 * @returns A clean, camelCase `OwnedToken` with all nested relations parsed
 */
export function parseOwnedToken(raw: RawOwnedToken): OwnedToken {
  return {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    tokenId: raw.token_id,
    block: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    // Cast needed: the owned_token document selects a subset of digital_asset fields;
    // parseDigitalAsset uses optional chaining and handles missing fields gracefully.
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset as any) : null,
    // Cast needed: the owned_token nft sub-selection omits `id` and collection/holder;
    // parseNft uses optional chaining and handles missing fields gracefully.
    nft: raw.nft ? parseNft(raw.nft as any) : null,
    // Cast needed: the owned_token ownedAsset sub-selection has basic fields only
    // (no nested DA/profile/tokenIdCount); parseOwnedAsset handles missing fields.
    ownedAsset: raw.ownedAsset ? parseOwnedAsset(raw.ownedAsset as any) : null,
    // Cast needed: the owned_token document selects a subset of universal_profile fields
    // (no `id`); parseProfile uses optional chaining and handles missing fields gracefully.
    holder: raw.universalProfile ? parseProfile(raw.universalProfile as any) : null,
  };
}

/**
 * Transform an array of raw Hasura owned token responses into clean `OwnedToken[]`.
 *
 * Convenience wrapper around `parseOwnedToken` for batch results.
 *
 * @param raw - Array of owned_token from the Hasura GraphQL response
 * @returns Array of clean, camelCase `OwnedToken` objects
 */
export function parseOwnedTokens(raw: RawOwnedToken[]): OwnedToken[] {
  return raw.map(parseOwnedToken);
}
