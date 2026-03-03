import { fetchProfile, getClientUrl, profileKeys } from '@lsp-indexer/node';
import {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfileParams,
} from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import { UseProfileReturn } from '../types';

/**
 * Fetch a single Universal Profile by address.
 *
 * Wraps `fetchProfile` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy (empty string, undefined via type widening, etc.).
 *
 * @param params - Profile address and optional include config
 * @returns `{ profile, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `profile`
 *
 * @example
 * ```tsx
 * import { useProfile } from '@lsp-indexer/react';
 *
 * function ProfileCard({ address }: { address: string }) {
 *   const { profile, isLoading, error } = useProfile({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!profile) return <p>Profile not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{profile.name ?? 'Unnamed'}</h2>
 *       <p>{profile.followerCount} followers</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfile<const I extends ProfileInclude>(
  params: UseProfileParams & { include: I },
): UseProfileReturn<ProfileResult<I>>;
export function useProfile(
  params: Omit<UseProfileParams, 'include'> & { include?: never },
): UseProfileReturn<Profile>;
export function useProfile(
  params: UseProfileParams & { include?: ProfileInclude },
): UseProfileReturn<PartialProfile>;
export function useProfile(
  params: UseProfileParams & { include?: ProfileInclude },
): UseProfileReturn<PartialProfile> {
  const url = getClientUrl();
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.detail(address, include),
    queryFn: () =>
      include ? fetchProfile(url, { address, include }) : fetchProfile(url, { address }),
    enabled: Boolean(address),
  });

  const profile = data ?? null;
  return { profile, ...rest };
}
