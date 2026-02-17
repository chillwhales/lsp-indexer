import type { GetProfileQuery } from '../graphql/graphql';
import type { Profile, ProfileImage } from '../types/profiles';

/**
 * Raw Hasura profile type from the codegen-generated query result.
 *
 * This is the shape of a single `universal_profile` element returned by
 * both `GetProfileQuery` and `GetProfilesQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawProfile = GetProfileQuery['universal_profile'][number];

/**
 * Raw avatar asset shape from Hasura (LSP3ProfileAsset — no width/height).
 */
type RawAvatar = NonNullable<NonNullable<RawProfile['lsp3_profile']>['avatar']>[number];

/**
 * Common shape for image types that have width/height (profile_image, background_image).
 * Uses a structural type rather than the codegen union to work with both `__typename` variants.
 */
interface RawImageWithDimensions {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  verification_method?: string | null;
  verification_data?: string | null;
}

/**
 * Parse a raw avatar asset (LSP3ProfileAsset) to a clean ProfileImage.
 *
 * Avatars don't have width/height in the Hasura schema, so dimensions
 * are always set to `null`.
 */
function parseAvatar(raw: RawAvatar): ProfileImage {
  return {
    url: raw.url ?? '',
    width: null,
    height: null,
    verification:
      raw.verification_method != null
        ? { method: raw.verification_method, data: raw.verification_data ?? '' }
        : null,
  };
}

/**
 * Parse a raw image (profile_image or background_image) to a clean ProfileImage.
 *
 * These image types include width and height from the Hasura schema.
 */
function parseImage(raw: RawImageWithDimensions): ProfileImage {
  return {
    url: raw.url ?? '',
    width: raw.width ?? null,
    height: raw.height ?? null,
    verification:
      raw.verification_method != null
        ? { method: raw.verification_method, data: raw.verification_data ?? '' }
        : null,
  };
}

/**
 * Transform a raw Hasura Universal Profile response into a clean `Profile` type.
 *
 * Handles all edge cases:
 * - `lsp3_profile` may be `null` (no metadata set)
 * - `@include(if: false)` omitted fields won't be present in the response —
 *   uses optional chaining and defaults arrays to `[]`, scalars to `null`
 * - Aggregate counts may have `null` aggregate — defaults to `0`
 * - Tags and links filter out `null` values from Hasura
 * - Image verification is `null` when no verification method exists
 *
 * @param raw - A single universal_profile from the Hasura GraphQL response
 * @returns A clean, camelCase `Profile` with safe defaults
 */
export function parseProfile(raw: RawProfile): Profile {
  const lsp3 = raw.lsp3_profile;

  return {
    address: raw.address,
    name: lsp3?.name?.value ?? null,
    description: lsp3?.description?.value ?? null,
    tags: lsp3?.tags?.map((t) => t.value).filter((v): v is string => v != null) ?? [],
    links:
      lsp3?.links?.map((l) => ({
        title: l.title ?? '',
        url: l.url ?? '',
      })) ?? [],
    avatar: lsp3?.avatar?.map(parseAvatar) ?? [],
    profileImage: lsp3?.profile_image?.map(parseImage) ?? [],
    backgroundImage: lsp3?.background_image?.map(parseImage) ?? [],
    followerCount: raw.followed_by_aggregate?.aggregate?.count ?? 0,
    followingCount: raw.followed_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Transform an array of raw Hasura Universal Profile responses into clean `Profile[]`.
 *
 * Convenience wrapper around `parseProfile` for batch results.
 *
 * @param raw - Array of universal_profile from the Hasura GraphQL response
 * @returns Array of clean, camelCase `Profile` objects
 */
export function parseProfiles(raw: RawProfile[]): Profile[] {
  return raw.map(parseProfile);
}
