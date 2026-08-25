'use server';

import {
  type FetchFollowsResult,
  type FetchProfilesResult,
  fetchFollowCount,
  fetchFollowedByMyFollows,
  fetchFollows,
  fetchIsFollowing,
  fetchIsFollowingBatch,
  fetchMutualFollowers,
  fetchMutualFollows,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type FollowCount,
  type FollowerFilter,
  type FollowerInclude,
  type FollowerResult,
  type FollowerSort,
  type PartialFollower,
  type PartialProfile,
  type ProfileInclude,
  type ProfileResult,
  type ProfileSort,
  type UseFollowCountParams,
  type UseIsFollowingBatchParams,
  type UseIsFollowingParams,
  UseFollowCountParamsSchema,
  UseFollowedByMyFollowsParamsSchema,
  UseFollowsParamsSchema,
  UseIsFollowingBatchParamsSchema,
  UseIsFollowingParamsSchema,
  UseMutualFollowersParamsSchema,
  UseMutualFollowsParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a paginated list of follow relationships. */
export async function getFollows(params: {
  network: string;
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
}): Promise<FetchFollowsResult>;
export async function getFollows<const I extends FollowerInclude>(params: {
  network: string;
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchFollowsResult<FollowerResult<I>>>;
export async function getFollows(params: {
  network: string;
  filter?: FollowerFilter;
  sort?: FollowerSort;
  limit?: number;
  offset?: number;
  include?: FollowerInclude;
}): Promise<FetchFollowsResult<PartialFollower>>;
export async function getFollows(params: {
  network: string;
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
export async function getFollowCount(params: UseFollowCountParams): Promise<FollowCount> {
  validateInput(UseFollowCountParamsSchema, params, 'getFollowCount');
  return await fetchFollowCount(getServerUrl(), params);
}

/** Server action: check if one address follows another. */
export async function getIsFollowing(params: UseIsFollowingParams): Promise<boolean> {
  validateInput(UseIsFollowingParamsSchema, params, 'getIsFollowing');
  return await fetchIsFollowing(getServerUrl(), params);
}

/** Server action: check multiple follower→followed pairs in one query. Returns Record (Map serialized for wire). */
export async function getIsFollowingBatch(
  params: UseIsFollowingBatchParams,
): Promise<Record<string, boolean>> {
  validateInput(UseIsFollowingBatchParamsSchema, params, 'getIsFollowingBatch');
  const resultMap = await fetchIsFollowingBatch(getServerUrl(), params);
  return Object.fromEntries(resultMap);
}

/** Server action: fetch profiles mutually followed by two addresses. */
export async function getMutualFollows(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
}): Promise<FetchProfilesResult>;
export async function getMutualFollows<const I extends ProfileInclude>(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function getMutualFollows(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>>;
export async function getMutualFollows(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>> {
  validateInput(UseMutualFollowsParamsSchema, params, 'getMutualFollows');
  return await fetchMutualFollows(getServerUrl(), params);
}

/** Server action: fetch profiles that mutually follow two addresses. */
export async function getMutualFollowers(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
}): Promise<FetchProfilesResult>;
export async function getMutualFollowers<const I extends ProfileInclude>(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function getMutualFollowers(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>>;
export async function getMutualFollowers(params: {
  network: string;
  addressA: string;
  addressB: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>> {
  validateInput(UseMutualFollowersParamsSchema, params, 'getMutualFollowers');
  return await fetchMutualFollowers(getServerUrl(), params);
}

/** Server action: fetch profiles followed by the follows of a given address. */
export async function getFollowedByMyFollows(params: {
  network: string;
  myAddress: string;
  targetAddress: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
}): Promise<FetchProfilesResult>;
export async function getFollowedByMyFollows<const I extends ProfileInclude>(params: {
  network: string;
  myAddress: string;
  targetAddress: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function getFollowedByMyFollows(params: {
  network: string;
  myAddress: string;
  targetAddress: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>>;
export async function getFollowedByMyFollows(params: {
  network: string;
  myAddress: string;
  targetAddress: string;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>> {
  validateInput(UseFollowedByMyFollowsParamsSchema, params, 'getFollowedByMyFollows');
  return await fetchFollowedByMyFollows(getServerUrl(), params);
}
