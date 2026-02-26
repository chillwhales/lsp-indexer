import type {
  FollowCount,
  Follower,
  FollowerFilter,
  FollowerInclude,
  FollowerResult,
  FollowerSort,
  PartialFollower,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetFollowCountDocument, GetFollowersDocument } from '../documents/followers';
import type { Follower_Bool_Exp, Follower_Order_By } from '../graphql/graphql';
import { parseFollowers } from '../parsers/followers';
import { buildProfileIncludeVars } from './profiles';
import {
  buildBlockOrderSort,
  escapeLike,
  hasActiveIncludes,
  normalizeTimestamp,
  orderDir,
} from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a `FollowerFilter` to a Hasura `follower_bool_exp`.
 *
 * All filter fields are optional — consumers scope results by setting
 * `followerAddress` and/or `followedAddress` in the filter:
 * - "who follows X?" → `filter: { followedAddress: X }`
 * - "who does X follow?" → `filter: { followerAddress: X }`
 *
 * Multiple conditions combine with `_and`. Empty filter = empty object.
 *
 * Filter → Hasura mapping:
 * - `filter.followerAddress` → `{ follower_address: { _ilike: '%escapeLike%' } }` (partial match)
 * - `filter.followedAddress` → `{ followed_address: { _ilike: '%escapeLike%' } }` (partial match)
 * - `filter.followerName` → nested profile name search via followerUniversalProfile
 * - `filter.followedName` → nested profile name search via followedUniversalProfile
 * - `filter.timestampFrom` → `{ timestamp: { _gte: timestampFrom } }`
 * - `filter.timestampTo` → `{ timestamp: { _lte: timestampTo } }`
 */
function buildFollowerWhere(filter: FollowerFilter | undefined): Follower_Bool_Exp {
  if (!filter) return {};

  const conditions: Follower_Bool_Exp[] = [];

  if (filter.followerAddress) {
    conditions.push({
      follower_address: { _ilike: `%${escapeLike(filter.followerAddress)}%` },
    });
  }

  if (filter.followedAddress) {
    conditions.push({
      followed_address: { _ilike: `%${escapeLike(filter.followedAddress)}%` },
    });
  }

  if (filter.followerName) {
    conditions.push({
      followerUniversalProfile: {
        lsp3Profile: { name: { value: { _ilike: `%${escapeLike(filter.followerName)}%` } } },
      },
    });
  }

  if (filter.followedName) {
    conditions.push({
      followedUniversalProfile: {
        lsp3Profile: { name: { value: { _ilike: `%${escapeLike(filter.followedName)}%` } } },
      },
    });
  }

  if (filter.timestampFrom != null) {
    conditions.push({
      timestamp: { _gte: normalizeTimestamp(filter.timestampFrom) },
    });
  }

  if (filter.timestampTo != null) {
    conditions.push({
      timestamp: { _lte: normalizeTimestamp(filter.timestampTo) },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a `FollowerSort` to a Hasura `follower_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'timestamp'`       → `[{ timestamp: dir }]`
 * - `'followerAddress'` → `[{ follower_address: dir }]`
 * - `'newest'`          → `buildBlockOrderSort('desc')` (block_number → transaction_index → log_index desc)
 * - `'oldest'`          → `buildBlockOrderSort('asc')` (block_number → transaction_index → log_index asc)
 * - `'followerAddress'` → `[{ follower_address: dir }]`
 * - `'followedAddress'` → `[{ followed_address: dir }]`
 * - `'followerName'`    → `[{ followerUniversalProfile: { lsp3Profile: { name: { value: dir } } } }]`
 * - `'followedName'`    → `[{ followedUniversalProfile: { lsp3Profile: { name: { value: dir } } } }]`
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 * Name sorts default to `nulls: 'last'` when not specified (profiles without names sort last).
 * `direction` and `nulls` are ignored for `'newest'` and `'oldest'` (self-describing fields).
 */
function buildFollowerOrderBy(sort?: FollowerSort): Follower_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc') as Follower_Order_By[];
    case 'oldest':
      return buildBlockOrderSort('asc') as Follower_Order_By[];
    case 'followerAddress':
      return [{ follower_address: dir }];
    case 'followedAddress':
      return [{ followed_address: dir }];
    case 'followerName':
      return [
        {
          followerUniversalProfile: {
            lsp3Profile: { name: { value: orderDir(sort.direction, sort.nulls ?? 'last') } },
          },
        },
      ];
    case 'followedName':
      return [
        {
          followedUniversalProfile: {
            lsp3Profile: { name: { value: orderDir(sort.direction, sort.nulls ?? 'last') } },
          },
        },
      ];
    default:
      return undefined;
  }
}

/**
 * Translate a `FollowerInclude` to GraphQL boolean variables for `@include` directives.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`. This implements "opt-in when specified" while the default fetches everything.
 *
 * **Profile sub-includes:** Reuses `buildProfileIncludeVars` with prefix replacement:
 * - `includeProfile*` → `includeFollowerProfile*` for follower profile sub-includes
 * - `includeProfile*` → `includeFollowedProfile*` for followed profile sub-includes
 *
 * @param include - Optional include config; `undefined` = include everything
 * @returns Record of boolean variables for the GetFollowers GraphQL document
 */
export function buildFollowerIncludeVars(include?: FollowerInclude): Record<string, boolean> {
  if (!include) return {};

  const activeFollowerProfile = hasActiveIncludes(include.followerProfile);
  const activeFollowedProfile = hasActiveIncludes(include.followedProfile);

  const vars: Record<string, boolean> = {
    includeTimestamp: include.timestamp ?? false,
    includeAddress: include.address ?? false,
    includeFollowerProfile: activeFollowerProfile,
    includeFollowedProfile: activeFollowedProfile,
  };

  // Follower profile sub-includes: reuse profile include builder with "FollowerProfile" prefix
  if (activeFollowerProfile) {
    const profileVars = buildProfileIncludeVars(include.followerProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeFollowerProfile')] = val;
    }
  }

  // Followed profile sub-includes: same pattern with "FollowedProfile" prefix
  if (activeFollowedProfile) {
    const profileVars = buildProfileIncludeVars(include.followedProfile);
    for (const [key, val] of Object.entries(profileVars)) {
      vars[key.replace('includeProfile', 'includeFollowedProfile')] = val;
    }
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated follow list queries.
 *
 * When the include parameter is provided, the `follows` array contains
 * narrowed types with only base fields + included fields.
 */
export interface FetchFollowsResult<P = Follower> {
  /** Parsed follow relationships for the current page (narrowed by include) */
  follows: P[];
  /** Total number of follow relationships matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of follow relationships with filtering, sorting,
 * total count, and optional include narrowing.
 *
 * Consumers scope results via the filter:
 * - "who follows X?" → `filter: { followedAddress: X }`
 * - "who does X follow?" → `filter: { followerAddress: X }`
 * - "all follows" → omit filter or add name/timestamp filters
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed follows (narrowed by include) and total count
 */
export async function fetchFollows(
  url: string,
  params: {
    filter?: FollowerFilter;
    sort?: FollowerSort;
    limit?: number;
    offset?: number;
  },
): Promise<FetchFollowsResult>;
export async function fetchFollows<const I extends FollowerInclude>(
  url: string,
  params: {
    filter?: FollowerFilter;
    sort?: FollowerSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchFollowsResult<FollowerResult<I>>>;
export async function fetchFollows(
  url: string,
  params: {
    filter?: FollowerFilter;
    sort?: FollowerSort;
    limit?: number;
    offset?: number;
    include?: FollowerInclude;
  },
): Promise<FetchFollowsResult<PartialFollower>>;
export async function fetchFollows(
  url: string,
  params: {
    filter?: FollowerFilter;
    sort?: FollowerSort;
    limit?: number;
    offset?: number;
    include?: FollowerInclude;
  },
): Promise<FetchFollowsResult<PartialFollower>> {
  const where = buildFollowerWhere(params.filter);
  const orderBy = buildFollowerOrderBy(params.sort);
  const includeVars = buildFollowerIncludeVars(params.include);

  const result = await execute(url, GetFollowersDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      follows: parseFollowers(result.follower, params.include),
      totalCount: result.follower_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    follows: parseFollowers(result.follower),
    totalCount: result.follower_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Fetch follow counts (follower + following) for an address.
 *
 * Uses two aliased `follower_aggregate` queries via `GetFollowCountDocument`:
 * - `followerCount` = count where `followed_address = address` (how many follow this address)
 * - `followingCount` = count where `follower_address = address` (how many this address follows)
 *
 * Uses exact-match `_ilike` (no `%` wrapping) for case-insensitive address matching.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address)
 * @returns FollowCount with followerCount and followingCount
 */
export async function fetchFollowCount(
  url: string,
  params: { address: string },
): Promise<FollowCount> {
  const escapedAddress = escapeLike(params.address);

  const result = await execute(url, GetFollowCountDocument, {
    followerWhere: { followed_address: { _ilike: escapedAddress } },
    followingWhere: { follower_address: { _ilike: escapedAddress } },
  });

  return {
    followerCount: result.followerCount?.aggregate?.count ?? 0,
    followingCount: result.followingCount?.aggregate?.count ?? 0,
  };
}

/**
 * Check if one address follows another.
 *
 * Reuses `GetFollowersDocument` with all includes disabled and `limit: 1` for efficiency.
 * Returns `true` if at least one follower record exists matching both addresses.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (followerAddress, followedAddress)
 * @returns `true` if followerAddress follows followedAddress, `false` otherwise
 */
export async function fetchIsFollowing(
  url: string,
  params: { followerAddress: string; followedAddress: string },
): Promise<boolean> {
  const result = await execute(url, GetFollowersDocument, {
    where: {
      _and: [
        { follower_address: { _ilike: escapeLike(params.followerAddress) } },
        { followed_address: { _ilike: escapeLike(params.followedAddress) } },
      ],
    },
    limit: 1,
    // Disable all includes for efficiency — we only need to know if a record exists
    includeTimestamp: false,
    includeAddress: false,
    includeFollowerProfile: false,
    includeFollowerProfileName: false,
    includeFollowerProfileDescription: false,
    includeFollowerProfileTags: false,
    includeFollowerProfileLinks: false,
    includeFollowerProfileAvatar: false,
    includeFollowerProfileImage: false,
    includeFollowerProfileBackgroundImage: false,
    includeFollowerProfileFollowerCount: false,
    includeFollowerProfileFollowingCount: false,
    includeFollowedProfile: false,
    includeFollowedProfileName: false,
    includeFollowedProfileDescription: false,
    includeFollowedProfileTags: false,
    includeFollowedProfileLinks: false,
    includeFollowedProfileAvatar: false,
    includeFollowedProfileImage: false,
    includeFollowedProfileBackgroundImage: false,
    includeFollowedProfileFollowerCount: false,
    includeFollowedProfileFollowingCount: false,
  });

  return result.follower.length > 0;
}
