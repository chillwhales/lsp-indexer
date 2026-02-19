import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { creatorKeys } from '@lsp-indexer/node';
import type {
  UseCreatorAddressesParams,
  UseInfiniteCreatorAddressesParams,
} from '@lsp-indexer/types';

import { getCreatorAddresses } from '../actions/creators';

/** Default number of creators per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of LSP4 creators via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useCreatorAddresses`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useCreatorAddresses } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset),
    queryFn: () => getCreatorAddresses({ filter, sort, limit, offset }),
  });

  return {
    creators: data?.creators ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch LSP4 creators with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteCreatorAddresses`, but routes
 * the request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteCreatorAddresses } from '@lsp-indexer/next';
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: creatorKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getCreatorAddresses({
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
