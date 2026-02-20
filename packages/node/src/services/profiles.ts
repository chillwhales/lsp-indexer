import type { Profile, ProfileFilter, ProfileInclude, ProfileSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetProfileDocument, GetProfilesDocument } from '../documents/profiles';
import type { Universal_Profile_Bool_Exp, Universal_Profile_Order_By } from '../graphql/graphql';
import { parseProfile, parseProfiles } from '../parsers/profiles';
import { escapeLike, orderDir } from './utils';

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
 * - `name`       → `{ lsp3Profile: { name: { value: { _ilike: '%name%' } } } }`
 * - `followedBy` → `{ followedBy: { follower_address: { _ilike: address } } }`
 *                   ("profiles that address X follows" = X is the follower)
 * - `following`  → `{ followed: { followed_address: { _ilike: address } } }`
 *                   ("profiles that follow address X" = X is the followed)
 * - `tokenOwned` → `{ ownedAssets: { address: { _ilike }, balance: { _gt } } }`
 *                   and/or `{ ownedTokens: { address: { _ilike }, token_id: { _ilike } } }`
 */
function buildProfileWhere(filter?: ProfileFilter): Universal_Profile_Bool_Exp {
  if (!filter) return {};

  const conditions: Universal_Profile_Bool_Exp[] = [];

  if (filter.name) {
    conditions.push({
      lsp3Profile: {
        name: { value: { _ilike: `%${escapeLike(filter.name)}%` } },
      },
    });
  }

  if (filter.followedBy) {
    // "Profiles that address X follows"
    // X is the follower → look at followedBy on the target profile
    // (followedBy = records where target is followedUniversalProfile,
    //  and X is follower_address)
    conditions.push({
      followedBy: { follower_address: { _ilike: filter.followedBy } },
    });
  }

  if (filter.following) {
    // "Profiles that follow address X"
    // The matched profiles are followers of X → look at followed relation
    // (followed = records where matched profile is followerUniversalProfile,
    //  and X is followed_address)
    conditions.push({
      followed: { followed_address: { _ilike: filter.following } },
    });
  }

  if (filter.tokenOwned) {
    const { address, tokenId, minBalance } = filter.tokenOwned;

    if (tokenId) {
      // Filter by specific token ID (NFT/LSP8)
      conditions.push({
        ownedTokens: {
          address: { _ilike: address },
          token_id: { _ilike: tokenId },
        },
      });
    } else {
      // Filter by token ownership (fungible/LSP7 or any token)
      const assetCondition: Universal_Profile_Bool_Exp = {
        ownedAssets: {
          address: { _ilike: address },
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
 * - `'name'`           → `[{ lsp3Profile: { name: { value: dir } } }]`
 * - `'followerCount'`  → `[{ followedBy_aggregate: { count: dir } }]`
 * - `'followingCount'` → `[{ followed_aggregate: { count: dir } }]`
 *
 * `dir` is composed from `sort.direction` + optional `sort.nulls` via `orderDir()`.
 */
function buildProfileOrderBy(sort?: ProfileSort): Universal_Profile_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'name':
      return [{ lsp3Profile: { name: { value: dir } } }];
    case 'followerCount':
      return [{ followedBy_aggregate: { count: dir } }];
    case 'followingCount':
      return [{ followed_aggregate: { count: dir } }];
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
    includeName: include.name ?? false,
    includeDescription: include.description ?? false,
    includeTags: include.tags ?? false,
    includeLinks: include.links ?? false,
    includeAvatar: include.avatar ?? false,
    includeProfileImage: include.profileImage ?? false,
    includeBackgroundImage: include.backgroundImage ?? false,
    includeFollowerCount: include.followerCount ?? false,
    includeFollowingCount: include.followingCount ?? false,
  };
}

/**
 * Build profile sub-include variables for use as a **nested relation** in other domains
 * (owned-assets, owned-tokens). Uses `includeProfile*` prefix to avoid colliding with
 * digital asset `include*` variables which share the same query.
 *
 * **Inverted default pattern:**
 * - When `include` is **undefined** (omitted) → returns `{}` — the GraphQL
 *   document defaults all `Boolean! = true` variables to `true`, so everything is fetched.
 * - When `include` is **provided** → each field defaults to `false` unless explicitly
 *   set to `true`.
 */
export function buildProfileIncludeVars(include?: ProfileInclude): Record<string, boolean> {
  if (!include) {
    return {};
  }

  return {
    includeProfileName: include.name ?? false,
    includeProfileDescription: include.description ?? false,
    includeProfileTags: include.tags ?? false,
    includeProfileLinks: include.links ?? false,
    includeProfileAvatar: include.avatar ?? false,
    includeProfileImage: include.profileImage ?? false,
    includeProfileBackgroundImage: include.backgroundImage ?? false,
    includeProfileFollowerCount: include.followerCount ?? false,
    includeProfileFollowingCount: include.followingCount ?? false,
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
    where: { address: { _ilike: params.address } },
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
