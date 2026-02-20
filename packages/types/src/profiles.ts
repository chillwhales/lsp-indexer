import { z } from 'zod';

import { SortDirectionSchema, SortNullsSchema } from './common';

// ---------------------------------------------------------------------------
// Core domain schemas
// ---------------------------------------------------------------------------

export const ProfileImageSchema = z.object({
  /** Image URL (IPFS gateway URL or HTTP URL) */
  url: z.string(),
  /** Image width in pixels, or `null` if not available */
  width: z.number().nullable(),
  /** Image height in pixels, or `null` if not available */
  height: z.number().nullable(),
  /** On-chain verification data, or `null` if not verified */
  verification: z
    .object({
      /** Verification method (e.g., "keccak256(bytes)") */
      method: z.string(),
      /** Verification data hash (e.g., "0x...") */
      data: z.string(),
    })
    .nullable(),
});

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
  /** Avatar assets from LSP3 metadata, or `null` if not included in query */
  avatar: z.array(ProfileImageSchema).nullable(),
  /** Profile images (typically a square photo or icon), or `null` if not included in query */
  profileImage: z.array(ProfileImageSchema).nullable(),
  /** Background/banner images, or `null` if not included in query */
  backgroundImage: z.array(ProfileImageSchema).nullable(),
  /** Number of profiles following this profile */
  followerCount: z.number(),
  /** Number of profiles this profile follows */
  followingCount: z.number(),
});

// ---------------------------------------------------------------------------
// Filter & sort schemas
// ---------------------------------------------------------------------------

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

export const UseProfileParamsSchema = z.object({
  /** The Universal Profile contract address to fetch */
  address: z.string(),
  /** Control which nested data to include (omit for all data) */
  include: ProfileIncludeSchema.optional(),
});

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

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileImage = z.infer<typeof ProfileImageSchema>;
export type ProfileFilter = z.infer<typeof ProfileFilterSchema>;
export type ProfileSort = z.infer<typeof ProfileSortSchema>;
export type ProfileSortField = z.infer<typeof ProfileSortFieldSchema>;
export type ProfileInclude = z.infer<typeof ProfileIncludeSchema>;
export type UseProfileParams = z.infer<typeof UseProfileParamsSchema>;
export type UseProfilesParams = z.infer<typeof UseProfilesParamsSchema>;
export type UseInfiniteProfilesParams = z.infer<typeof UseInfiniteProfilesParamsSchema>;
