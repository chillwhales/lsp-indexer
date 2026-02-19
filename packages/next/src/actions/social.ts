'use server';

import type { FetchFollowersResult, FetchFollowingResult } from '@lsp-indexer/node';
import { fetchFollowCount, fetchFollowers, fetchFollowing, getServerUrl } from '@lsp-indexer/node';
import type { FollowCount, FollowerSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch followers of an address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchFollowers` server-side. This keeps the GraphQL endpoint invisible to the client.
 *
 * @param params - Address and optional sort/pagination
 * @returns Parsed followers and total count
 */
export async function getFollowers(params: {
  address: string;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
}): Promise<FetchFollowersResult> {
  const url = getServerUrl();
  return fetchFollowers(url, params);
}

/**
 * Server action: Fetch who an address is following.
 *
 * @param params - Address and optional sort/pagination
 * @returns Parsed following and total count
 */
export async function getFollowing(params: {
  address: string;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
}): Promise<FetchFollowingResult> {
  const url = getServerUrl();
  return fetchFollowing(url, params);
}

/**
 * Server action: Fetch follow counts for an address.
 *
 * @param params - Address to get counts for
 * @returns Follow count with { followerCount, followingCount }
 */
export async function getFollowCount(params: { address: string }): Promise<FollowCount> {
  const url = getServerUrl();
  return fetchFollowCount(url, params);
}
