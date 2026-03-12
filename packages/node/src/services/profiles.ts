import type {
  PartialProfile,
  Profile,
  ProfileFilter,
  ProfileInclude,
  ProfileResult,
  ProfileSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import {
  GetProfileDocument,
  GetProfilesDocument,
  ProfileSubscriptionDocument,
} from '../documents/profiles';
import type {
  ProfileSubscriptionSubscription,
  Universal_Profile_Bool_Exp,
  Universal_Profile_Order_By,
} from '../graphql/graphql';
import { parseProfile, parseProfiles } from '../parsers/profiles';
import { buildBlockOrderSort, escapeLike, orderDir } from './utils';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/** Translate ProfileFilter to a Hasura _bool_exp. */
export function buildProfileWhere(filter?: ProfileFilter): Universal_Profile_Bool_Exp {
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
  if (conditions.length === 1) return conditions[0];
  return { _and: conditions };
}

/** Translate ProfileSort to a Hasura order_by. */
export function buildProfileOrderBy(sort?: ProfileSort): Universal_Profile_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
    case 'name':
      return [{ lsp3Profile: { name: { value: dir } } }, ...buildBlockOrderSort('desc')];
    case 'followerCount':
      return [{ followedBy_aggregate: { count: dir } }, ...buildBlockOrderSort('desc')];
    case 'followingCount':
      return [{ followed_aggregate: { count: dir } }, ...buildBlockOrderSort('desc')];
    default:
      return undefined;
  }
}

/** Build @include directive variables from include config. */
export function buildProfileIncludeDirectives(include?: ProfileInclude): Record<string, boolean> {
  if (!include) {
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

/** Build profile sub-include variables for nested relations (includeProfile* prefix). */
export function buildProfileIncludeVars(
  include?: boolean | ProfileInclude,
): Record<string, boolean> {
  if (!include) {
    return {};
  }
  // true = include everything → return empty (GraphQL defaults all to true)
  if (include === true) {
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
// Subscription config builder
// ---------------------------------------------------------------------------

type RawProfileSubscriptionRow = ProfileSubscriptionSubscription['universal_profile'][number];

/** Build subscription config for useSubscription. */
export function buildProfileSubscriptionConfig(params: {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  include?: ProfileInclude;
}) {
  const where = buildProfileWhere(params.filter);
  const orderBy = buildProfileOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildProfileIncludeDirectives(params.include);

  return {
    document: ProfileSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: ProfileSubscriptionSubscription) => result.universal_profile,
    parser: (raw: RawProfileSubscriptionRow[]) =>
      params.include ? parseProfiles(raw, params.include) : parseProfiles(raw),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/** Fetch a single Universal Profile by address. */
export async function fetchProfile(
  url: string,
  params: { address: string },
): Promise<Profile | null>;
export async function fetchProfile<const I extends ProfileInclude>(
  url: string,
  params: { address: string; include: I },
): Promise<ProfileResult<I> | null>;
export async function fetchProfile(
  url: string,
  params: { address: string; include?: ProfileInclude },
): Promise<PartialProfile | null>;
export async function fetchProfile(
  url: string,
  params: { address: string; include?: ProfileInclude },
): Promise<PartialProfile | null> {
  const includeVars = buildProfileIncludeDirectives(params.include);

  const result = await execute(url, GetProfileDocument, {
    where: { address: { _ilike: params.address } },
    ...includeVars,
  });

  const raw = result.universal_profile[0];
  if (!raw) return null;
  if (params.include) return parseProfile(raw, params.include);
  return parseProfile(raw);
}

export interface FetchProfilesResult<P = Profile> {
  profiles: P[];
  totalCount: number;
}

/** Fetch a paginated list of Universal Profiles. */
export async function fetchProfiles(
  url: string,
  params?: { filter?: ProfileFilter; sort?: ProfileSort; limit?: number; offset?: number },
): Promise<FetchProfilesResult>;
export async function fetchProfiles<const I extends ProfileInclude>(
  url: string,
  params: {
    filter?: ProfileFilter;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include: I;
  },
): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function fetchProfiles(
  url: string,
  params: {
    filter?: ProfileFilter;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include?: ProfileInclude;
  },
): Promise<FetchProfilesResult<PartialProfile>>;
export async function fetchProfiles(
  url: string,
  params: {
    filter?: ProfileFilter;
    sort?: ProfileSort;
    limit?: number;
    offset?: number;
    include?: ProfileInclude;
  } = {},
): Promise<FetchProfilesResult<PartialProfile>> {
  const where = buildProfileWhere(params.filter);
  const orderBy = buildProfileOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildProfileIncludeDirectives(params.include);

  const result = await execute(url, GetProfilesDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
    ...includeVars,
  });

  if (params.include) {
    return {
      profiles: parseProfiles(result.universal_profile, params.include),
      totalCount: result.universal_profile_aggregate?.aggregate?.count ?? 0,
    };
  }
  return {
    profiles: parseProfiles(result.universal_profile),
    totalCount: result.universal_profile_aggregate?.aggregate?.count ?? 0,
  };
}
