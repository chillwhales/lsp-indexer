'use server';

import type { FetchFollowsResult } from '@lsp-indexer/node';
import { fetchFollowCount, fetchFollows, fetchIsFollowing, getServerUrl } from '@lsp-indexer/node';
import type {
  FollowCount,
  FollowerFilter,
  FollowerInclude,
  FollowerResult,
  FollowerSort,
  PartialFollower,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of follow relationships.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchFollows` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * Consumers scope results via filter fields:
 * - "who follows X?" → `filter: { followedAddress: X }`
 * - "who does X follow?" → `filter: { followerAddress: X }`
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed follows and total count
 */
export async function getFollows(params: {
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
}): Promise<FetchFollowsResult>;
export async function getFollows<const I extends FollowerInclude>(params: {
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchFollowsResult<FollowerResult<I>>>;
export async function getFollows(params: {
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include?: FollowerInclude;
}): Promise<FetchFollowsResult<PartialFollower>>;
export async function getFollows(params: {
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include?: FollowerInclude;
}): Promise<FetchFollowsResult<PartialFollower>> {
  return fetchFollows(getServerUrl(), params);
}

/**
 * Server action: Fetch follow counts (follower + following) for an address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchFollowCount` server-side.
 *
 * @param address - The address whose follow counts to fetch
 * @returns FollowCount with followerCount and followingCount
 */
export async function getFollowCount(address: string): Promise<FollowCount> {
  return fetchFollowCount(getServerUrl(), { address });
}

/**
 * Server action: Check if one address follows another.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchIsFollowing` server-side.
 *
 * @param followerAddress - The address that might be following
 * @param followedAddress - The address that might be followed
 * @returns `true` if followerAddress follows followedAddress, `false` otherwise
 */
export async function getIsFollowing(
  followerAddress: string,
  followedAddress: string,
): Promise<boolean> {
  return fetchIsFollowing(getServerUrl(), { followerAddress, followedAddress });
}
