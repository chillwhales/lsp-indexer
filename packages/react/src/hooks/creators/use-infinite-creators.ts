import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys, fetchCreators, getClientUrl } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseInfiniteCreatorsParams,
} from '@lsp-indexer/types';

/** Default number of creators per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useInfiniteCreators — creators array + infinite scroll controls + query state */
type UseInfiniteCreatorsReturn<F> = {
  creators: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchCreatorsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch LSP4 creator records with infinite scroll pagination.
 *
 * Wraps `fetchCreators` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `creators` array.
 * Uses a **separate query key namespace** from `useCreators` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 */
export function useInfiniteCreators<const I extends CreatorInclude>(
  params: UseInfiniteCreatorsParams & { include: I },
): UseInfiniteCreatorsReturn<CreatorResult<I>>;
export function useInfiniteCreators(
  params?: Omit<UseInfiniteCreatorsParams, 'include'> & { include?: never },
): UseInfiniteCreatorsReturn<Creator>;
export function useInfiniteCreators(
  params: UseInfiniteCreatorsParams & { include?: CreatorInclude },
): UseInfiniteCreatorsReturn<PartialCreator>;
export function useInfiniteCreators(
  params: UseInfiniteCreatorsParams & { include?: CreatorInclude } = {},
): UseInfiniteCreatorsReturn<PartialCreator> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: creatorKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchCreators(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchCreators(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.creators.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single creators array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const creators = useMemo(() => data?.pages.flatMap((page) => page.creators) ?? [], [data?.pages]);

  return {
    creators,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
