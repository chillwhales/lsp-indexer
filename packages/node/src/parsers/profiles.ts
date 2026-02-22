import type { PartialProfile, Profile, ProfileInclude } from '@lsp-indexer/types';
import type { GetProfileQuery } from '../graphql/graphql';
import { stripExcluded } from './strip';
import { parseAsset, parseImage, parseLinks } from './utils';

/**
 * Raw Hasura profile type from the codegen-generated query result.
 *
 * Uses `Omit<..., 'id'>` because the parser never reads `id` — it only needs
 * `address`, `lsp3Profile`, and aggregate counts. This allows the same parser
 * to accept both primary query results (which include `id`) and sub-selections
 * from other domains (owned-assets, nfts, owned-tokens) which don't select `id`.
 * TypeScript structural subtyping means types WITH `id` still satisfy this.
 */
type RawProfile = Omit<GetProfileQuery['universal_profile'][number], 'id'>;

/**
 * Transform a raw Hasura Universal Profile response into a clean `Profile` type.
 *
 * Handles all edge cases:
 * - `lsp3_profile` may be `null` (no metadata set)
 * - `@include(if: false)` omitted fields won't be present in the response —
 *   uses optional chaining; omitted arrays become `null`, included-but-empty arrays become `[]`
 * - Aggregate counts may have `null` aggregate — defaults to `0`
 * - Tags and links filter out `null` values from Hasura
 * - Image verification is `null` when no verification method exists
 *
 * Uses function overloads for type-safe return types:
 * - No `include` → returns full `Profile` (all fields guaranteed)
 * - With `include` → returns `PartialProfile` (only `address` guaranteed, rest optional)
 *
 * @param raw - A single universal_profile from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped at runtime
 * @returns A clean, camelCase `Profile` (full or partial depending on include)
 */
export function parseProfile(raw: RawProfile): Profile;
export function parseProfile(raw: RawProfile, include: ProfileInclude): PartialProfile;
export function parseProfile(raw: RawProfile, include?: ProfileInclude): Profile | PartialProfile {
  const lsp3 = raw.lsp3Profile;

  const profile: Profile = {
    address: raw.address,
    name: lsp3?.name?.value ?? null,
    description: lsp3?.description?.value ?? null,
    tags:
      lsp3?.tags != null
        ? lsp3.tags.map((t) => t.value).filter((v): v is string => v != null)
        : null,
    links: parseLinks(lsp3?.links),
    avatar: lsp3?.avatar != null ? lsp3.avatar.map(parseAsset) : null,
    profileImage: lsp3?.profileImage != null ? lsp3.profileImage.map(parseImage) : null,
    backgroundImage: lsp3?.backgroundImage != null ? lsp3.backgroundImage.map(parseImage) : null,
    followerCount: raw.followedBy_aggregate?.aggregate?.count ?? 0,
    followingCount: raw.followed_aggregate?.aggregate?.count ?? 0,
  };

  if (!include) return profile;
  return stripExcluded(profile, include, ['address']);
}

/**
 * Transform an array of raw Hasura Universal Profile responses into clean `Profile[]`.
 *
 * Convenience wrapper around `parseProfile` for batch results.
 *
 * @param raw - Array of universal_profile from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each `parseProfile` call
 * @returns Array of clean, camelCase `Profile` objects (full or partial depending on include)
 */
export function parseProfiles(raw: RawProfile[]): Profile[];
export function parseProfiles(raw: RawProfile[], include: ProfileInclude): PartialProfile[];
export function parseProfiles(
  raw: RawProfile[],
  include?: ProfileInclude,
): (Profile | PartialProfile)[] {
  if (!include) return raw.map((r) => parseProfile(r));
  return raw.map((r) => parseProfile(r, include));
}
