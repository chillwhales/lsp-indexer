import { z } from 'zod';

import { AssetSchema, ImageSchema, SortDirectionSchema, SortNullsSchema } from './common';
import type { IncludeResult, PartialExcept } from './include-types';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

/** Zod schema for a Universal Profile — validates all fields from the Hasura response after parsing. */
export const ProfileSchema = z.object({
  /** The Universal Profile contract address (checksummed or lowercase hex) */
  address: z.string(),
  /** Display name from LSP3 metadata, or `null` if not set */
  name: z.string().nullable(),
  /** Profile description from LSP3 metadata, or `null` if not set */
  description: z.string().nullable(),
  /** Tags associated with the profile, or `null` if not included in query */
  tags: z.array(z.string()).nullable(),
  /** External links (social media, websites, etc.), or `null` if not included in query */
  links: z.array(z.object({ title: z.string(), url: z.string() })).nullable(),
  /** Avatar assets from LSP3 metadata (3D files, media — NOT images), or `null` if not included in query */
  avatar: z.array(AssetSchema).nullable(),
  /** Profile images (typically a square photo or icon), or `null` if not included in query */
  profileImage: z.array(ImageSchema).nullable(),
  /** Background/banner images, or `null` if not included in query */
  backgroundImage: z.array(ImageSchema).nullable(),
  /** Number of profiles following this profile */
  followerCount: z.number(),
  /** Number of profiles this profile follows */
  followingCount: z.number(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

/** Zod schema for profile query filters — validates name search, follow relations, and token ownership. */
export const ProfileFilterSchema = z.object({
  /** Case-insensitive partial match on profile name */
  name: z.string().optional(),
  /** Return profiles that the given address follows */
  followedBy: z.string().optional(),
  /** Return profiles that follow the given address */
  following: z.string().optional(),
  /** Return profiles that own a specific token */
  tokenOwned: z
    .object({
      /** Token contract address */
      address: z.string(),
      /** Specific token ID (for NFTs/LSP8 tokens) */
      tokenId: z.string().optional(),
      /** Minimum token balance (as string to handle large numbers) */
      minBalance: z.string().optional(),
    })
    .optional(),
});

/** Fields available for sorting profile lists */
export const ProfileSortFieldSchema = z.enum(['name', 'followerCount', 'followingCount']);

/** Zod schema for profile sort configuration — validates field, direction, and null ordering. */
export const ProfileSortSchema = z.object({
  /** Which field to sort by */
  field: ProfileSortFieldSchema,
  /** Sort direction */
  direction: SortDirectionSchema,
  /** Where nulls appear — omit to use Hasura default (nulls last for asc, nulls first for desc) */
  nulls: SortNullsSchema.optional(),
});

/**
 * Control which nested fields to include in a profile query.
 *
 * **Behavior:**
 * - When `include` is **omitted** entirely → all fields are included (GraphQL defaults to `true`)
 * - When `include` is **provided** → only fields explicitly set to `true` are included;
 *   unspecified fields default to `false` (opt-in when provided)
 *
 * @example
 * ```ts
 * // Include everything (default)
 * useProfile({ address: '0x...' });
 *
 * // Include only name and follower count
 * useProfile({ address: '0x...', include: { name: true, followerCount: true } });
 * ```
 */
export const ProfileIncludeSchema = z.object({
  /** Include profile name (included by default when `include` is omitted; `false` when `include` is provided but this field is not set) */
  name: z.boolean().optional(),
  /** Include profile description */
  description: z.boolean().optional(),
  /** Include profile tags */
  tags: z.boolean().optional(),
  /** Include external links */
  links: z.boolean().optional(),
  /** Include avatar images */
  avatar: z.boolean().optional(),
  /** Include profile images */
  profileImage: z.boolean().optional(),
  /** Include background images */
  backgroundImage: z.boolean().optional(),
  /** Include follower count aggregate */
  followerCount: z.boolean().optional(),
  /** Include following count aggregate */
  followingCount: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Hook parameter schemas
// ---------------------------------------------------------------------------

/** Zod schema for `useProfile` hook parameters — validates address and optional include config. */
export const UseProfileParamsSchema = z.object({
  /** The Universal Profile contract address to fetch */
  address: z.string(),
  /** Control which nested data to include (omit for all data) */
  include: ProfileIncludeSchema.optional(),
});

/** Zod schema for `useProfiles` hook parameters — validates filter, sort, pagination, and include. */
export const UseProfilesParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: ProfileFilterSchema.optional(),
  /** Sort order for results */
  sort: ProfileSortSchema.optional(),
  /** Maximum number of profiles to return */
  limit: z.number().optional(),
  /** Number of profiles to skip (for offset-based pagination) */
  offset: z.number().optional(),
  /** Control which nested data to include (omit for all data) */
  include: ProfileIncludeSchema.optional(),
});

/** Zod schema for `useInfiniteProfiles` hook parameters — validates filter, sort, page size, and include. */
export const UseInfiniteProfilesParamsSchema = z.object({
  /** Filter criteria (all combine with AND logic) */
  filter: ProfileFilterSchema.optional(),
  /** Sort order for results */
  sort: ProfileSortSchema.optional(),
  /** Number of profiles per page (default: 20) */
  pageSize: z.number().optional(),
  /** Control which nested data to include (omit for all data) */
  include: ProfileIncludeSchema.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (single source of truth — derive from schemas)
// ---------------------------------------------------------------------------

/** Clean camelCase Universal Profile after parsing from Hasura. See {@link ProfileSchema}. */
export type Profile = z.infer<typeof ProfileSchema>;
/** Profile query filter parameters. See {@link ProfileFilterSchema}. */
export type ProfileFilter = z.infer<typeof ProfileFilterSchema>;
/** Profile sort configuration. See {@link ProfileSortSchema}. */
export type ProfileSort = z.infer<typeof ProfileSortSchema>;
/** Available fields for sorting profiles. See {@link ProfileSortFieldSchema}. */
export type ProfileSortField = z.infer<typeof ProfileSortFieldSchema>;
/** Field inclusion config for profile queries. See {@link ProfileIncludeSchema}. */
export type ProfileInclude = z.infer<typeof ProfileIncludeSchema>;
/** Parameters for the `useProfile` hook. See {@link UseProfileParamsSchema}. */
export type UseProfileParams = z.infer<typeof UseProfileParamsSchema>;
/** Parameters for the `useProfiles` hook. See {@link UseProfilesParamsSchema}. */
export type UseProfilesParams = z.infer<typeof UseProfilesParamsSchema>;
/** Parameters for the `useInfiniteProfiles` hook. See {@link UseInfiniteProfilesParamsSchema}. */
export type UseInfiniteProfilesParams = z.infer<typeof UseInfiniteProfilesParamsSchema>;

// ---------------------------------------------------------------------------
// Conditional include result type
// ---------------------------------------------------------------------------

/**
 * Include field map: include schema key → Profile field name.
 * For profiles, the mapping is 1:1 (include key matches field name exactly).
 */
type ProfileIncludeFieldMap = {
  name: 'name';
  description: 'description';
  tags: 'tags';
  links: 'links';
  avatar: 'avatar';
  profileImage: 'profileImage';
  backgroundImage: 'backgroundImage';
  followerCount: 'followerCount';
  followingCount: 'followingCount';
};

/**
 * Profile type narrowed by include parameter.
 *
 * - `ProfileResult` (no generic) → full `Profile` type (backward compatible)
 * - `ProfileResult<{}>` → `{ address: string }` (base fields only)
 * - `ProfileResult<{ name: true }>` → `{ address: string; name: string | null }`
 * - `ProfileResult<{ name: true; tags: false }>` → same as `{ name: true }`
 *
 * @example
 * ```ts
 * type Full = ProfileResult;                      // = Profile (all fields)
 * type Minimal = ProfileResult<{}>;               // = { address: string }
 * type NameOnly = ProfileResult<{ name: true }>;  // = { address: string; name: string | null }
 * ```
 */
export type ProfileResult<I extends ProfileInclude | undefined = undefined> = IncludeResult<
  Profile,
  'address',
  ProfileIncludeFieldMap,
  I
>;

/**
 * Profile with only base fields guaranteed — used for functions that accept
 * any include-narrowed profile. All non-base fields are optional.
 *
 * Equivalent to `PartialExcept<Profile, 'address'>`.
 */
export type PartialProfile = PartialExcept<Profile, 'address'>;
