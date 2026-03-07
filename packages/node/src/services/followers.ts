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
import {
  FollowerSubscriptionDocument,
  GetFollowCountDocument,
  GetFollowersDocument,
} from '../documents/followers';
import type {
  Follower_Bool_Exp,
  Follower_Order_By,
  FollowerSubscriptionSubscription,
} from '../graphql/graphql';
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

/** Translate FollowerFilter to a Hasura _bool_exp. */
export function buildFollowerWhere(filter: FollowerFilter | undefined): Follower_Bool_Exp {
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

/** Translate FollowerSort to a Hasura order_by. */
function buildFollowerOrderBy(sort?: FollowerSort): Follower_Order_By[] | undefined {
  if (!sort) return undefined;

  const dir = orderDir(sort.direction, sort.nulls);

  switch (sort.field) {
    case 'newest':
      return buildBlockOrderSort('desc');
    case 'oldest':
      return buildBlockOrderSort('asc');
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

/** Build @include directive variables from include config. */
export function buildFollowerIncludeVars(include?: FollowerInclude): Record<string, boolean> {
  if (!include) return {};

  const activeFollowerProfile = hasActiveIncludes(include.followerProfile);
  const activeFollowedProfile = hasActiveIncludes(include.followedProfile);

  const vars: Record<string, boolean> = {
    includeTimestamp: include.timestamp ?? false,
    includeAddress: include.address ?? false,
    includeBlockNumber: include.blockNumber ?? false,
    includeTransactionIndex: include.transactionIndex ?? false,
    includeLogIndex: include.logIndex ?? false,
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

export interface FetchFollowsResult<P = Follower> {
  follows: P[];
  totalCount: number;
}

/** Fetch a paginated list of follow relationships. */
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
  const orderBy = buildFollowerOrderBy(params.sort) ?? buildBlockOrderSort('desc');
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

/** Fetch follower and following counts for an address. */
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

/** Check if one address follows another. */
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
    includeBlockNumber: false,
    includeTransactionIndex: false,
    includeLogIndex: false,
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

// ---------------------------------------------------------------------------
// Subscription config builder
// ---------------------------------------------------------------------------

/** Raw subscription row type extracted from codegen. */
type RawFollowerSubscriptionRow = FollowerSubscriptionSubscription['follower'][number];

/** Build subscription config for useSubscription. */
export function buildFollowerSubscriptionConfig(params: {
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  include?: FollowerInclude;
}) {
  const where = buildFollowerWhere(params.filter);
  const orderBy = buildFollowerOrderBy(params.sort) ?? buildBlockOrderSort('desc');
  const includeVars = buildFollowerIncludeVars(params.include);

  return {
    document: FollowerSubscriptionDocument,
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: orderBy,
      limit: params.limit,
      ...includeVars,
    },
    extract: (result: FollowerSubscriptionSubscription) => result.follower,
    parser: (raw: RawFollowerSubscriptionRow[]) =>
      params.include ? parseFollowers(raw, params.include) : parseFollowers(raw),
  };
}
