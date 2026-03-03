import { fetchProfiles, getClientUrl, profileKeys } from '@lsp-indexer/node';
import {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseInfiniteProfilesParams,
} from '@lsp-indexer/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { UseInfiniteProfilesReturn } from '../types';

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
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: profileKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchProfiles(url, { filter, sort, limit: pageSize, offset: pageParam, include })
        : fetchProfiles(url, { filter, sort, limit: pageSize, offset: pageParam }),
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
