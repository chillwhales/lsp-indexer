import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys, fetchCreators, getClientUrl } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseCreatorsParams,
  UseInfiniteCreatorsParams,
} from '@lsp-indexer/types';

/** Default number of creators per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useCreators — creators array + totalCount + query state */
type UseCreatorsReturn<F> = { creators: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchCreatorsResult<F>, Error>,
  'data'
>;

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
 * Fetch a paginated list of LSP4 creator records with filtering and sorting.
 *
 * Wraps `fetchCreators` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by creatorAddress, digitalAssetAddress, interfaceId, creatorName,
 * digitalAssetName, timestampFrom, timestampTo) and sorting (by timestamp,
 * creatorAddress, digitalAssetAddress, arrayIndex, creatorName, digitalAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useCreators } from '@lsp-indexer/react';
 *
 * function CreatorList({ address }: { address: string }) {
 *   const { creators, totalCount, isLoading } = useCreators({
 *     filter: { digitalAssetAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} creators</p>
 *       {creators.map((c) => (
 *         <div key={`${c.creatorAddress}-${c.digitalAssetAddress}`}>
 *           {c.creatorAddress}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCreators<const I extends CreatorInclude>(
  params: UseCreatorsParams & { include: I },
): UseCreatorsReturn<CreatorResult<I>>;
export function useCreators(
  params?: Omit<UseCreatorsParams, 'include'> & { include?: never },
): UseCreatorsReturn<Creator>;
export function useCreators(
  params: UseCreatorsParams & { include?: CreatorInclude },
): UseCreatorsReturn<PartialCreator>;
export function useCreators(
  params: UseCreatorsParams & { include?: CreatorInclude } = {},
): UseCreatorsReturn<PartialCreator> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchCreators(url, { filter, sort, limit, offset, include })
        : fetchCreators(url, { filter, sort, limit, offset }),
  });

  const creators = data?.creators ?? [];
  return { creators, totalCount: data?.totalCount ?? 0, ...rest };
}

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
 *
 * @example
 * ```tsx
 * import { useInfiniteCreators } from '@lsp-indexer/react';
 *
 * function InfiniteCreatorList({ address }: { address: string }) {
 *   const {
 *     creators,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteCreators({
 *     filter: { digitalAssetAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {creators.map((c) => (
 *         <div key={`${c.creatorAddress}-${c.digitalAssetAddress}`}>
 *           {c.creatorAddress}
 *         </div>
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
