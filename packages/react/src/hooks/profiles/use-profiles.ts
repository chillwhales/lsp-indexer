import { fetchProfiles, getClientUrl, profileKeys } from '@lsp-indexer/node';
import {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfilesParams,
} from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import { UseProfilesReturn } from '../types';

/**
 * Fetch a paginated list of Universal Profiles with filtering and sorting.
 *
 * Wraps `fetchProfiles` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by name, follow relationships, token ownership) and sorting
 * (by name, follower count, following count).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ profiles, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `profiles` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useProfiles } from '@lsp-indexer/react';
 *
 * function ProfileList() {
 *   const { profiles, totalCount, isLoading } = useProfiles({
 *     filter: { name: 'alice' },
 *     sort: { field: 'followerCount', direction: 'desc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} profiles found</p>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfiles<const I extends ProfileInclude>(
  params: UseProfilesParams & { include: I },
): UseProfilesReturn<ProfileResult<I>>;
export function useProfiles(
  params?: Omit<UseProfilesParams, 'include'> & { include?: never },
): UseProfilesReturn<Profile>;
export function useProfiles(
  params: UseProfilesParams & { include?: ProfileInclude },
): UseProfilesReturn<PartialProfile>;
export function useProfiles(
  params: UseProfilesParams & { include?: ProfileInclude } = {},
): UseProfilesReturn<PartialProfile> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchProfiles(url, { filter, sort, limit, offset, include })
        : fetchProfiles(url, { filter, sort, limit, offset }),
  });

  const profiles = data?.profiles ?? [];
  return { profiles, totalCount: data?.totalCount ?? 0, ...rest };
}
