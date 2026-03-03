/**
 * Factory for useInfiniteProfiles — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteProfiles(queryFn)` with its own fetch:
 * - React: `(p) => fetchProfiles(getClientUrl(), p)`
 * - Next:  `(p) => getProfiles(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchProfilesResult } from '@lsp-indexer/node';
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseInfiniteProfilesParams,
} from '@lsp-indexer/types';
import type { UseInfiniteProfilesReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteProfilesParams with optional include */
type ProfileInfiniteParams = UseInfiniteProfilesParams & { include?: ProfileInclude };

/**
 * Create a `useInfiniteProfiles` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for profile lists (with limit + offset)
 *
 * @example
 * ```ts
 * // packages/react/src/hooks/profiles/use-infinite-profiles.ts
 * export const useInfiniteProfiles = createUseInfiniteProfiles(
 *   (p) => p.include
 *     ? fetchProfiles(getClientUrl(), p)
 *     : fetchProfiles(getClientUrl(), p),
 * );
 * ```
 */
export function createUseInfiniteProfiles(
  queryFn: (
    params: ProfileInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseInfinite<
    ProfileInfiniteParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) => profileKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useInfiniteProfiles<const I extends ProfileInclude>(
    params: UseInfiniteProfilesParams & { include: I },
  ): UseInfiniteProfilesReturn<ProfileResult<I>>;
  function useInfiniteProfiles(
    params?: Omit<UseInfiniteProfilesParams, 'include'> & { include?: never },
  ): UseInfiniteProfilesReturn<Profile>;
  function useInfiniteProfiles(
    params: UseInfiniteProfilesParams & { include?: ProfileInclude },
  ): UseInfiniteProfilesReturn<PartialProfile>;
  function useInfiniteProfiles(
    params: UseInfiniteProfilesParams & { include?: ProfileInclude } = {},
  ): UseInfiniteProfilesReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useInfiniteProfiles;
}
