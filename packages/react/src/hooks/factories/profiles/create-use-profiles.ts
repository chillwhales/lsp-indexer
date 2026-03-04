/**
 * Factory for useProfiles — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfiles(queryFn)` with its own fetch function:
 * - React: `(p) => fetchProfiles(getClientUrl(), p)`
 * - Next:  `(p) => getProfiles(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchProfilesResult } from '@lsp-indexer/node';
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfilesParams,
} from '@lsp-indexer/types';
import type { UseProfilesReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type ProfileListParams = UseProfilesParams & { include?: ProfileInclude };

/**
 * Create a `useProfiles` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for profile lists
 *
 * @example
 * ```ts
 * // packages/react/src/hooks/profiles/use-profiles.ts
 * export const useProfiles = createUseProfiles(
 *   (p) => p.include
 *     ? fetchProfiles(getClientUrl(), p)
 *     : fetchProfiles(getClientUrl(), p),
 * );
 * ```
 */
export function createUseProfiles(
  queryFn: (params: ProfileListParams) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseList<
    ProfileListParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) => profileKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useProfiles<const I extends ProfileInclude>(
    params: UseProfilesParams & { include: I },
  ): UseProfilesReturn<ProfileResult<I>>;
  function useProfiles(
    params?: Omit<UseProfilesParams, 'include'> & { include?: never },
  ): UseProfilesReturn<Profile>;
  function useProfiles(
    params: UseProfilesParams & { include?: ProfileInclude },
  ): UseProfilesReturn<PartialProfile>;
  function useProfiles(
    params: UseProfilesParams & { include?: ProfileInclude } = {},
  ): UseProfilesReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useProfiles;
}
