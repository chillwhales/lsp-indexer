import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getClientUrl } from '../client/env';
import { profileKeys } from '../keys/profiles';
import { fetchProfile, fetchProfiles } from '../services/profiles';
import type {
  UseInfiniteProfilesParams,
  UseProfileParams,
  UseProfilesParams,
} from '../types/profiles';

/** Default number of profiles per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

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
export function useProfile(params: UseProfileParams) {
  const url = getClientUrl();
  const { address, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.detail(address, include),
    queryFn: () => fetchProfile(url, { address, include }),
    enabled: Boolean(address),
  });

  return { profile: data ?? null, ...rest };
}

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
export function useProfiles(params: UseProfilesParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: profileKeys.list(filter, sort, limit, offset, include),
    queryFn: () => fetchProfiles(url, { filter, sort, limit, offset, include }),
  });

  return {
    profiles: data?.profiles ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch Universal Profiles with infinite scroll pagination.
 *
 * Wraps `fetchProfiles` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `profiles` array.
 * Uses a **separate query key namespace** from `useProfiles` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ profiles, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened profiles array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteProfiles } from '@lsp-indexer/react';
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
export function useInfiniteProfiles(params: UseInfiniteProfilesParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: profileKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      fetchProfiles(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
        include,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.profiles.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single profiles array
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const profiles = data?.pages.flatMap((page) => page.profiles) ?? [];

  return {
    profiles,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
