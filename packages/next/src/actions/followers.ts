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
import {
  UseFollowCountParamsSchema,
  UseFollowsParamsSchema,
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
  return fetchFollows(getServerUrl(), params);
}

/** Server action: fetch follower and following counts for an address. */
export async function getFollowCount(address: string): Promise<FollowCount> {
  validateInput(UseFollowCountParamsSchema, { address }, 'getFollowCount');
  return fetchFollowCount(getServerUrl(), { address });
}

/** Server action: check if one address follows another. */
export async function getIsFollowing(
  followerAddress: string,
  followedAddress: string,
): Promise<boolean> {
  validateInput(UseIsFollowingParamsSchema, { followerAddress, followedAddress }, 'getIsFollowing');
  return fetchIsFollowing(getServerUrl(), { followerAddress, followedAddress });
}
