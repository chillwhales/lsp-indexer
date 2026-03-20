'use server';

import {
  type FetchFollowsResult,
  fetchFollowCount,
  fetchFollows,
  fetchIsFollowing,
  fetchIsFollowingBatch,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type FollowCount,
  type FollowerFilter,
  type FollowerInclude,
  type FollowerResult,
  type FollowerSort,
  type PartialFollower,
  type UseIsFollowingBatchParams,
  UseFollowCountParamsSchema,
  UseFollowsParamsSchema,
  UseIsFollowingBatchParamsSchema,
  UseIsFollowingParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of follow relationships. */
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
  validateInput(UseFollowsParamsSchema, params, 'getFollows');
  return await fetchFollows(getServerUrl(), params);
}

/** Server action: fetch follower and following counts for an address. */
export async function getFollowCount(address: string): Promise<FollowCount> {
  validateInput(UseFollowCountParamsSchema, { address }, 'getFollowCount');
  return await fetchFollowCount(getServerUrl(), { address });
}

/** Server action: check if one address follows another. */
export async function getIsFollowing(
  followerAddress: string,
  followedAddress: string,
): Promise<boolean> {
  validateInput(UseIsFollowingParamsSchema, { followerAddress, followedAddress }, 'getIsFollowing');
  return await fetchIsFollowing(getServerUrl(), { followerAddress, followedAddress });
}

/** Server action: check multiple follower→followed pairs in one query. Returns Record (Map serialized for wire). */
export async function getIsFollowingBatch(
  pairs: UseIsFollowingBatchParams['pairs'],
): Promise<Record<string, boolean>> {
  validateInput(UseIsFollowingBatchParamsSchema, { pairs }, 'getIsFollowingBatch');
  const resultMap = await fetchIsFollowingBatch(getServerUrl(), { pairs });
  return Object.fromEntries(resultMap);
}
