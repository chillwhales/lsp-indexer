import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { creatorKeys, fetchCreatorAddresses, getClientUrl } from '@lsp-indexer/node';
import type {
  UseCreatorAddressesParams,
  UseInfiniteCreatorAddressesParams,
} from '@lsp-indexer/types';

/** Default number of creators per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of LSP4 creators with filtering and sorting.
 *
 * Wraps `fetchCreatorAddresses` in a TanStack `useQuery` hook. Supports filtering
 * by asset address and creator address, plus sorting.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useCreatorAddresses } from '@lsp-indexer/react';
 *
 * function CreatorList({ assetAddress }: { assetAddress: string }) {
 *   const { creators, totalCount, isLoading } = useCreatorAddresses({
 *     filter: { assetAddress },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} creators found</p>
 *       {creators.map((c) => (
 *         <div key={`${c.assetAddress}-${c.creatorAddress}`}>{c.creatorAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCreatorAddresses(params: UseCreatorAddressesParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchCreatorAddresses(url, { filter, sort, limit, offset }),
  });

  return {
    creators: data?.creators ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP4 creators with infinite scroll pagination.
 *
 * Wraps `fetchCreatorAddresses` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `creators` array.
 * Uses a **separate query key namespace** from `useCreatorAddresses` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteCreatorAddresses } from '@lsp-indexer/react';
 *
 * function InfiniteCreatorList() {
 *   const {
 *     creators,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteCreatorAddresses({
 *     filter: { assetAddress: '0x...' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {creators.map((c) => (
 *         <div key={`${c.assetAddress}-${c.creatorAddress}`}>{c.creatorAddress}</div>
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
export function useInfiniteCreatorAddresses(params: UseInfiniteCreatorAddressesParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: creatorKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchCreatorAddresses(url, {
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
