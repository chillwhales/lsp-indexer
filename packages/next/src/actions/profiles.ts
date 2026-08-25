'use server';

import {
  type FetchProfilesResult,
  fetchProfile,
  fetchProfiles,
  getServerUrl,
} from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileFilter,
  type ProfileInclude,
  type ProfileResult,
  type ProfileSort,
  UseProfileParamsSchema,
  UseProfilesParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch a single profile by address. */
export async function getProfile(params: {
  network: string;
  address: string;
}): Promise<Profile | null>;
export async function getProfile<const I extends ProfileInclude>(params: {
  network: string;
  address: string;
  include: I;
}): Promise<ProfileResult<I> | null>;
export async function getProfile(params: {
  network: string;
  address: string;
  include?: ProfileInclude;
}): Promise<PartialProfile | null>;
export async function getProfile(params: {
  network: string;
  address: string;
  include?: ProfileInclude;
}): Promise<PartialProfile | null> {
  validateInput(UseProfileParamsSchema, params, 'getProfile');
  return await fetchProfile(getServerUrl(), params);
}

/** Server action: fetch a paginated list of profiles. */
export async function getProfiles(params: {
  network: string;
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
}): Promise<FetchProfilesResult>;
export async function getProfiles<const I extends ProfileInclude>(params: {
  network: string;
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function getProfiles(params: {
  network: string;
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>>;
export async function getProfiles(params: {
  network: string;
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>> {
  validateInput(UseProfilesParamsSchema, params, 'getProfiles');
  return await fetchProfiles(getServerUrl(), params);
}
