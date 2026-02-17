import { execute } from '../client/execute';
import { GetProfileDocument, GetProfilesDocument } from '../documents/profiles';
import type { Universal_Profile_Bool_Exp, Universal_Profile_Order_By } from '../graphql/graphql';
import { parseProfile, parseProfiles } from '../parsers/profiles';
import type { Profile, ProfileFilter, ProfileInclude, ProfileSort } from '../types/profiles';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `ProfileFilter` to a Hasura `universal_profile_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `name`       → `{ lsp3_profile: { name: { value: { _ilike: '%name%' } } } }`
 * - `followedBy` → `{ followed_by: { follower_address: { _eq: address } } }`
 *                   ("profiles that address X follows" = X is the follower)
 * - `following`  → `{ followed: { followed_address: { _eq: address } } }`
 *                   ("profiles that follow address X" = X is the followed)
 * - `tokenOwned` → `{ owned_assets: { address: { _eq }, balance: { _gt } } }`
 *                   and/or `{ owned_tokens: { address: { _eq }, token_id: { _eq } } }`
 */
function buildProfileWhere(filter?: ProfileFilter): Universal_Profile_Bool_Exp {
  if (!filter) return {};

  const conditions: Universal_Profile_Bool_Exp[] = [];

  if (filter.name) {
    conditions.push({
      lsp3_profile: {
        name: { value: { _ilike: `%${filter.name}%` } },
      },
    });
  }

  if (filter.followedBy) {
    // "Profiles that address X follows"
    // X is the follower → look at followed_by on the target profile
    // (followed_by = records where target is followedUniversalProfile,
    //  and X is follower_address)
    conditions.push({
      followed_by: { follower_address: { _eq: filter.followedBy } },
    });
  }

  if (filter.following) {
    // "Profiles that follow address X"
    // The matched profiles are followers of X → look at followed relation
    // (followed = records where matched profile is followerUniversalProfile,
    //  and X is followed_address)
    conditions.push({
      followed: { followed_address: { _eq: filter.following } },
    });
  }

  if (filter.tokenOwned) {
    const { address, tokenId, minBalance } = filter.tokenOwned;

    if (tokenId) {
      // Filter by specific token ID (NFT/LSP8)
      conditions.push({
        owned_tokens: {
          address: { _eq: address },
          token_id: { _eq: tokenId },
        },
      });
    } else {
      // Filter by token ownership (fungible/LSP7 or any token)
      const assetCondition: Universal_Profile_Bool_Exp = {
        owned_assets: {
          address: { _eq: address },
          ...(minBalance ? { balance: { _gt: minBalance } } : {}),
        },
      };
      conditions.push(assetCondition);
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `ProfileSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'name'`           → `[{ lsp3_profile: { name: { value: direction } } }]`
 * - `'followerCount'`  → `[{ followed_by_aggregate: { count: direction } }]`
 * - `'followingCount'` → `[{ followed_aggregate: { count: direction } }]`
 */
function buildProfileOrderBy(sort?: ProfileSort): Universal_Profile_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'name':
      return [{ lsp3_profile: { name: { value: sort.direction } } }];
    case 'followerCount':
      return [{ followed_by_aggregate: { count: sort.direction } }];
    case 'followingCount':
      return [{ followed_aggregate: { count: sort.direction } }];
    default:
      return undefined;
  }
}

/**
 * Translate a `ProfileInclude` to GraphQL boolean variables for `@include` directives.
 *
 * When `include` is undefined (omitted), returns an empty object — the GraphQL
 * document defaults all `@include` booleans to `true`, so everything is included.
 *
 * When `include` is provided, each field defaults to `false` unless explicitly set
 * to `true`. This implements the "opt-in when specified" contract.
 */
function buildIncludeVars(include?: ProfileInclude): Record<string, boolean> {
  if (!include) {
    // Omitted = include everything (GraphQL defaults all to true)
    return {};
  }

  return {
    includeTags: include.tags ?? false,
    includeLinks: include.links ?? false,
    includeAvatar: include.avatar ?? false,
    includeProfileImage: include.profileImage ?? false,
    includeBackgroundImage: include.backgroundImage ?? false,
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Fetch a single Universal Profile by address.
 *
 * Translates the address to a Hasura `where` clause, executes the query,
 * and returns the first result parsed as a clean `Profile`, or `null` if
 * the address doesn't exist.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + optional include)
 * @returns The parsed profile, or `null` if not found
 */
export async function fetchProfile(
  url: string,
  params: { address: string; include?: ProfileInclude },
): Promise<Profile | null> {
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetProfileDocument, {
    where: { address: { _eq: params.address } },
    ...includeVars,
  });

  const raw = result.universal_profile[0];
  return raw ? parseProfile(raw) : null;
}

/**
 * Result shape for paginated profile list queries.
 */
export interface FetchProfilesResult {
  /** Parsed profiles for the current page */
  profiles: Profile[];
  /** Total number of profiles matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of Universal Profiles with filtering, sorting, and total count.
 *
 * Translates flat filter/sort/include params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed profiles and total count
 */
export async function fetchProfiles(
  url: string,
  params: {
    filter?: ProfileFilter;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include?: ProfileInclude;
  } = {},
): Promise<FetchProfilesResult> {
  const where = buildProfileWhere(params.filter);
  const orderBy = buildProfileOrderBy(params.sort);
  const includeVars = buildIncludeVars(params.include);

  const result = await execute(url, GetProfilesDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  return {
    profiles: parseProfiles(result.universal_profile),
    totalCount: result.universal_profile_aggregate?.aggregate?.count ?? 0,
  };
}
