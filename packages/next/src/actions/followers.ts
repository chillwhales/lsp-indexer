'use server';

import type { FetchFollowersResult } from '@lsp-indexer/node';
import {
  fetchFollowCount,
  fetchFollowers,
  fetchIsFollowing,
  getServerUrl,
} from '@lsp-indexer/node';
import type {
  FollowCount,
  FollowerFilter,
  FollowerInclude,
  FollowerSort,
  PartialFollower,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a paginated list of followers.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchFollowers` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * The `direction` param determines query semantics:
 * - `'followers'` → find followers OF the given address
 * - `'following'` → find who the given address FOLLOWS
 *
 * @param params - Query parameters (address, direction, filter, sort, pagination, include)
 * @returns Parsed followers and total count
 */
export async function getFollowers(params: {
  address: string;
  direction: 'followers' | 'following';
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
}): Promise<FetchFollowersResult>;
export async function getFollowers(params: {
  address: string;
  direction: 'followers' | 'following';
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include: FollowerInclude;
}): Promise<FetchFollowersResult<PartialFollower>>;
export async function getFollowers(params: {
  address: string;
  direction: 'followers' | 'following';
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include?: FollowerInclude;
}): Promise<FetchFollowersResult | FetchFollowersResult<PartialFollower>> {
  const url = getServerUrl();
  if (params.include) return fetchFollowers(url, params);
  return fetchFollowers(url, params);
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
  const url = getServerUrl();
  return fetchFollowCount(url, { address });
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
  const url = getServerUrl();
  return fetchIsFollowing(url, { followerAddress, followedAddress });
}
