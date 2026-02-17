/**
 * Profile domain types for Universal Profile data.
 *
 * These are the clean, public-facing types that consumers interact with.
 * All Hasura/GraphQL implementation details are hidden — types use camelCase
 * naming and follow the LSP3 Profile Metadata standard.
 *
 * @see https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-3-Profile-Metadata.md
 */

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/**
 * A LUKSO Universal Profile with metadata, images, and social counts.
 *
 * Follows a mixed null strategy:
 * - Scalar fields use `| null` (missing name is semantically different from empty string)
 * - Array fields default to `[]` (always safe to `.map()`, empty means "none")
 */
export interface Profile {
  /** The Universal Profile contract address (checksummed or lowercase hex) */
  address: string;

  /** Display name from LSP3 metadata, or `null` if not set */
  name: string | null;

  /** Profile description from LSP3 metadata, or `null` if not set */
  description: string | null;

  /** Tags associated with the profile (e.g., "artist", "developer") */
  tags: string[];

  /** External links (social media, websites, etc.) */
  links: Array<{ title: string; url: string }>;

  /** Avatar assets from LSP3 metadata */
  avatar: Array<ProfileImage>;

  /** Profile images (typically a square photo or icon) */
  profileImage: Array<ProfileImage>;

  /** Background/banner images */
  backgroundImage: Array<ProfileImage>;

  /** Number of profiles following this profile */
  followerCount: number;

  /** Number of profiles this profile follows */
  followingCount: number;
}

/**
 * An image associated with a Universal Profile.
 *
 * Used for avatar, profileImage, and backgroundImage arrays.
 * Width and height may be `null` for avatar assets (LSP3ProfileAsset doesn't include dimensions).
 * Verification data may be `null` when no on-chain verification exists.
 */
export interface ProfileImage {
  /** Image URL (IPFS gateway URL or HTTP URL) */
  url: string;

  /** Image width in pixels, or `null` if not available */
  width: number | null;

  /** Image height in pixels, or `null` if not available */
  height: number | null;

  /** On-chain verification data, or `null` if not verified */
  verification: {
    /** Verification method (e.g., "keccak256(bytes)") */
    method: string;
    /** Verification data hash (e.g., "0x...") */
    data: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Filter & sort types
// ---------------------------------------------------------------------------

/**
 * Filtering options for profile list queries.
 *
 * All filters are optional and combine with AND logic when multiple are provided.
 * The service layer translates these to Hasura `where` clauses — consumers never
 * see Hasura's `_eq`, `_ilike`, or nested relation syntax.
 */
export interface ProfileFilter {
  /** Case-insensitive partial match on profile name (e.g., "alice" matches "Alice in Chains") */
  name?: string;

  /**
   * Return profiles that the given address follows.
   * For example, `followedBy: "0xABC"` returns all profiles that 0xABC has followed.
   */
  followedBy?: string;

  /**
   * Return profiles that follow the given address.
   * For example, `following: "0xABC"` returns all profiles that are followers of 0xABC.
   */
  following?: string;

  /**
   * Return profiles that own a specific token.
   * Optionally filter by token ID (for NFTs) or minimum balance.
   */
  tokenOwned?: {
    /** Token contract address */
    address: string;
    /** Specific token ID (for NFTs/LSP8 tokens) */
    tokenId?: string;
    /** Minimum token balance (for fungible/LSP7 tokens, as string to handle large numbers) */
    minBalance?: string;
  };
}

/** Fields available for sorting profile lists */
export type ProfileSortField = 'name' | 'followerCount' | 'followingCount';

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting options for profile list queries.
 *
 * The service layer handles the complexity of translating sort fields to Hasura's
 * nested `order_by` syntax (e.g., `followerCount` maps to `followed_by_aggregate: { count: desc }`).
 */
export interface ProfileSort {
  /** Which field to sort by */
  field: ProfileSortField;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Controls which nested data is included in the query response.
 *
 * When omitted entirely, all nested data is included (all default to `true`).
 * When provided, only fields set to `true` are fetched — this maps to
 * `@include(if: $var)` directives in the underlying GraphQL document.
 *
 * Use this to reduce payload size when you don't need all profile data.
 *
 * @example
 * ```ts
 * // Fetch only tags and links, skip all images
 * useProfile({ address, include: { tags: true, links: true } });
 *
 * // Fetch everything (default behavior)
 * useProfile({ address });
 * ```
 */
export interface ProfileInclude {
  /** Include profile tags (default: true) */
  tags?: boolean;
  /** Include external links (default: true) */
  links?: boolean;
  /** Include avatar images (default: true) */
  avatar?: boolean;
  /** Include profile images (default: true) */
  profileImage?: boolean;
  /** Include background images (default: true) */
  backgroundImage?: boolean;
}

// ---------------------------------------------------------------------------
// Hook parameter types
// ---------------------------------------------------------------------------

/**
 * Parameters for `useProfile` — fetches a single Universal Profile by address.
 *
 * @example
 * ```ts
 * const { profile, isLoading, error } = useProfile({
 *   address: '0x1234...',
 *   include: { tags: true, profileImage: true },
 * });
 * ```
 */
export interface UseProfileParams {
  /** The Universal Profile contract address to fetch */
  address: string;
  /** Control which nested data to include (omit for all data) */
  include?: ProfileInclude;
}

/**
 * Parameters for `useProfiles` — fetches a paginated list of Universal Profiles.
 *
 * @example
 * ```ts
 * const { profiles, totalCount, isLoading } = useProfiles({
 *   filter: { name: 'alice' },
 *   sort: { field: 'followerCount', direction: 'desc' },
 *   limit: 20,
 *   offset: 0,
 * });
 * ```
 */
export interface UseProfilesParams {
  /** Filter criteria (all combine with AND logic) */
  filter?: ProfileFilter;
  /** Sort order for results */
  sort?: ProfileSort;
  /** Maximum number of profiles to return */
  limit?: number;
  /** Number of profiles to skip (for offset-based pagination) */
  offset?: number;
  /** Control which nested data to include (omit for all data) */
  include?: ProfileInclude;
}

/**
 * Parameters for `useInfiniteProfiles` — infinite scroll pagination for Universal Profiles.
 *
 * Uses TanStack Query's `useInfiniteQuery` under the hood with offset-based pagination.
 *
 * @example
 * ```ts
 * const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteProfiles({
 *   filter: { followedBy: '0x1234...' },
 *   sort: { field: 'name', direction: 'asc' },
 *   pageSize: 20,
 * });
 * ```
 */
export interface UseInfiniteProfilesParams {
  /** Filter criteria (all combine with AND logic) */
  filter?: ProfileFilter;
  /** Sort order for results */
  sort?: ProfileSort;
  /** Number of profiles per page (default: 20) */
  pageSize?: number;
  /** Control which nested data to include (omit for all data) */
  include?: ProfileInclude;
}
