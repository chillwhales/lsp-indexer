import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchProfilesResult } from '@lsp-indexer/node';
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseInfiniteProfilesParams,
  UseProfileParams,
  UseProfilesParams,
} from '@lsp-indexer/types';

import { getProfile, getProfiles } from '../actions/profiles';

/** Default number of profiles per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useProfile — profile + query state */
type UseProfileReturn<F> = { profile: F | null } & Omit<UseQueryResult<F | null, Error>, 'data'>;

/** Flat return shape for useProfiles — profiles array + totalCount + query state */
type UseProfilesReturn<F> = { profiles: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchProfilesResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteProfiles — profiles array + infinite scroll controls + query state */
type UseInfiniteProfilesReturn<F> = {
  profiles: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchProfilesResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a single Universal Profile by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useProfile`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Profile address and optional include config
 * @returns `{ profile, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `profile`
 *
 * @example
 * ```tsx
 * import { useProfile } from '@lsp-indexer/next';
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
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.detail(address, include),
    queryFn: () => (include ? getProfile(address, include) : getProfile(address)),
    enabled: Boolean(address),
  });

  const profile = data ?? null;
  return { profile, ...rest };
}

/**
 * Fetch a paginated list of Universal Profiles via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useProfiles`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ profiles, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `profiles` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useProfiles } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getProfiles({ filter, sort, limit, offset, include })
        : getProfiles({ filter, sort, limit, offset }),
  });

  const profiles = data?.profiles ?? [];
  return { profiles, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch Universal Profiles with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteProfiles`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened profiles array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteProfiles } from '@lsp-indexer/next';
 *
 * function InfiniteProfileList() {
 *   const {
 *     profiles,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteProfiles({
 *     filter: { followedBy: '0x1234...' },
 *     sort: { field: 'name', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {profiles.map((p) => (
 *         <div key={p.address}>{p.name}</div>
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load more'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteProfiles<const I extends ProfileInclude>(
  params: UseInfiniteProfilesParams & { include: I },
): UseInfiniteProfilesReturn<ProfileResult<I>>;
export function useInfiniteProfiles(
  params?: Omit<UseInfiniteProfilesParams, 'include'> & { include?: never },
): UseInfiniteProfilesReturn<Profile>;
export function useInfiniteProfiles(
  params: UseInfiniteProfilesParams & { include?: ProfileInclude },
): UseInfiniteProfilesReturn<PartialProfile>;
export function useInfiniteProfiles(
  params: UseInfiniteProfilesParams & { include?: ProfileInclude } = {},
): UseInfiniteProfilesReturn<PartialProfile> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: profileKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getProfiles({ filter, sort, limit: pageSize, offset: pageParam, include })
        : getProfiles({ filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.profiles.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single profiles array (memoized to avoid re-flattening on every render)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const profiles = useMemo(() => data?.pages.flatMap((page) => page.profiles) ?? [], [data?.pages]);

  return {
    profiles,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
