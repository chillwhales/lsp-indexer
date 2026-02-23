'use server';

import type { FetchProfilesResult } from '@lsp-indexer/node';
import { fetchProfile, fetchProfiles, getServerUrl } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileFilter,
  ProfileInclude,
  ProfileSort,
} from '@lsp-indexer/types';

/**
 * Server action: Fetch a single Universal Profile by address.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchProfile` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * @param address - The Universal Profile contract address
 * @param include - Optional field inclusion config
 * @returns The parsed profile, or `null` if not found
 */
export async function getProfile(address: string): Promise<Profile | null>;
export async function getProfile<const I extends ProfileInclude>(
  address: string,
  include: I,
): Promise<ProfileResult<I> | null>;
export async function getProfile(
  address: string,
  include?: ProfileInclude,
): Promise<PartialProfile | null>;
export async function getProfile(
  address: string,
  include?: ProfileInclude,
): Promise<PartialProfile | null> {
  const url = getServerUrl();
  if (include) return fetchProfile(url, { address, include });
  return fetchProfile(url, { address });
}

/**
 * Server action: Fetch a paginated list of Universal Profiles.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchProfiles` server-side. Supports filtering, sorting, pagination, and
 * field inclusion.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed profiles and total count
 */
export async function getProfiles(params?: {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
}): Promise<FetchProfilesResult>;
export async function getProfiles<const I extends ProfileInclude>(params: {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include: I;
}): Promise<FetchProfilesResult<ProfileResult<I>>>;
export async function getProfiles(params: {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>>;
export async function getProfiles(params?: {
  filter?: ProfileFilter;
  sort?: ProfileSort;
  limit?: number;
  offset?: number;
  include?: ProfileInclude;
}): Promise<FetchProfilesResult<PartialProfile>> {
  const url = getServerUrl();
  if (params?.include) return fetchProfiles(url, params);
  return fetchProfiles(url, params ?? {});
}
