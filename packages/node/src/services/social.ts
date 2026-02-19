import type { FollowCount, Follower, FollowerSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetFollowCountDocument, GetFollowersDocument } from '../documents/social';
import type { Follower_Order_By } from '../graphql/graphql';
import { parseFollowCount, parseFollowers } from '../parsers/social';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `FollowerSort` to a Hasura `follower_order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'followerAddress'`  → `[{ follower_address: direction }]`
 * - `'followedAddress'`  → `[{ followed_address: direction }]`
 */
function buildFollowerOrderBy(sort?: FollowerSort): Follower_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'followerAddress':
      return [{ follower_address: sort.direction }];
    case 'followedAddress':
      return [{ followed_address: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated follower list queries.
 */
export interface FetchFollowersResult {
  /** Parsed followers for the current page */
  followers: Follower[];
  /** Total number of followers matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch followers of an address (who follows this address).
 *
 * Queries the `follower` table filtered by `followed_address` — each row
 * represents an active follow relationship where the target is the specified address.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + optional sort/pagination)
 * @returns Parsed followers and total count
 */
export async function fetchFollowers(
  url: string,
  params: { address: string; sort?: FollowerSort; limit?: number; offset?: number },
): Promise<FetchFollowersResult> {
  const orderBy = buildFollowerOrderBy(params.sort);

  const result = await execute(url, GetFollowersDocument, {
    where: { followed_address: { _ilike: params.address } },
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    followers: parseFollowers(result.follower),
    totalCount: result.follower_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Result shape for paginated following list queries.
 */
export interface FetchFollowingResult {
  /** Parsed following for the current page */
  following: Follower[];
  /** Total number of addresses being followed (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch who an address is following (addresses this address follows).
 *
 * Queries the `follower` table filtered by `follower_address` — each row
 * represents an active follow relationship where the follower is the specified address.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address + optional sort/pagination)
 * @returns Parsed following and total count
 */
export async function fetchFollowing(
  url: string,
  params: { address: string; sort?: FollowerSort; limit?: number; offset?: number },
): Promise<FetchFollowingResult> {
  const orderBy = buildFollowerOrderBy(params.sort);

  const result = await execute(url, GetFollowersDocument, {
    where: { follower_address: { _ilike: params.address } },
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    following: parseFollowers(result.follower),
    totalCount: result.follower_aggregate?.aggregate?.count ?? 0,
  };
}

/**
 * Fetch follow counts (both follower and following counts) for an address.
 *
 * Uses two aliased `follower_aggregate` queries to get both counts in a single request:
 * - followerCount: how many addresses follow this address
 * - followingCount: how many addresses this address follows
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (address)
 * @returns Parsed follow count with { followerCount, followingCount }
 */
export async function fetchFollowCount(
  url: string,
  params: { address: string },
): Promise<FollowCount> {
  const result = await execute(url, GetFollowCountDocument, {
    followerWhere: { followed_address: { _ilike: params.address } },
    followingWhere: { follower_address: { _ilike: params.address } },
  });

  return parseFollowCount(result);
}
