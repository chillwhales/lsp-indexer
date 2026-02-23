import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseCreatorsParams,
  UseInfiniteCreatorsParams,
} from '@lsp-indexer/types';

import { getCreators } from '../actions/creators';

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
 * Fetch a paginated list of LSP4 creator records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useCreators`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useCreators } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getCreators({ filter, sort, limit, offset, include })
        : getCreators({ filter, sort, limit, offset }),
  });

  const creators = data?.creators ?? [];
  return { creators, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch LSP4 creator records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteCreators`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteCreators } from '@lsp-indexer/next';
 *
 * function InfiniteCreatorList({ address }: { address: string }) {
 *   const {
 *     creators,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteCreators({
 *     filter: { digitalAssetAddress: address },
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: creatorKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getCreators({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : getCreators({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.creators.length < pageSize) {
        return undefined;
      }
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
