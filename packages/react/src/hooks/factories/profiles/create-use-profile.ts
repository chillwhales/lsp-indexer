/**
 * Factory for useProfile — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfile(queryFn)` with its own fetch function:
 * - React: `(p) => fetchProfile(getClientUrl(), p)`
 * - Next:  `(p) => getProfile(p.address, p.include)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfileParams,
} from '@lsp-indexer/types';
import type { UseProfileReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — address + optional include */
type ProfileDetailParams = UseProfileParams & { include?: ProfileInclude };

/**
 * Create a `useProfile` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for a single profile
 *
 * @example
 * ```ts
 * // packages/react/src/hooks/profiles/use-profile.ts
 * export const useProfile = createUseProfile(
 *   (p) => p.include
 *     ? fetchProfile(getClientUrl(), { address: p.address, include: p.include })
 *     : fetchProfile(getClientUrl(), { address: p.address }),
 * );
 * ```
 */
export function createUseProfile(
  queryFn: (params: ProfileDetailParams) => Promise<PartialProfile | null>,
) {
  const impl = createUseDetail<ProfileDetailParams, PartialProfile>({
    queryKey: (p) => profileKeys.detail(p.address, p.include),
    queryFn,
    enabled: (p) => Boolean(p.address),
  });

  function useProfile<const I extends ProfileInclude>(
    params: UseProfileParams & { include: I },
  ): UseProfileReturn<ProfileResult<I>>;
  function useProfile(
    params: Omit<UseProfileParams, 'include'> & { include?: never },
  ): UseProfileReturn<Profile>;
  function useProfile(
    params: UseProfileParams & { include?: ProfileInclude },
  ): UseProfileReturn<PartialProfile>;
  function useProfile(
    params: UseProfileParams & { include?: ProfileInclude },
  ): UseProfileReturn<PartialProfile> {
    const { data, ...rest } = impl(params);
    return { profile: data, ...rest };
  }

  return useProfile;
}
