import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { dataChangedKeys, fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import type {
  UseDataChangedEventsParams,
  UseInfiniteDataChangedEventsParams,
} from '@lsp-indexer/types';

/** Default number of events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of ERC725 data change events with filtering and sorting.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useQuery` hook. Default sort
 * is `blockNumber DESC` (newest events first) when no sort is provided.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ events, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `events` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDataChangedEvents } from '@lsp-indexer/react';
 *
 * function DataChangedList() {
 *   const { events, totalCount, isLoading } = useDataChangedEvents({
 *     filter: { contractAddress: '0x1234...' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} events found</p>
 *       {events.map((e) => (
 *         <div key={e.id}>{e.dataKey}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDataChangedEvents(params: UseDataChangedEventsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: dataChangedKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchDataChangedEvents(url, { filter, sort, limit, offset }),
  });

  return {
    events: data?.events ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch ERC725 data change events with infinite scroll pagination.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useInfiniteQuery` hook with
 * offset-based pagination. Pages are automatically flattened into a single
 * `events` array. Default sort is `blockNumber DESC` (newest events first).
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ events, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened events array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDataChangedEvents } from '@lsp-indexer/react';
 *
 * function InfiniteDataChangedList() {
 *   const {
 *     events,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteDataChangedEvents({
 *     filter: { contractAddress: '0x1234...' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {events.map((e) => (
 *         <div key={e.id}>{e.dataKey}</div>
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
export function useInfiniteDataChangedEvents(params: UseInfiniteDataChangedEventsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: dataChangedKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchDataChangedEvents(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.events.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const events = useMemo(() => data?.pages.flatMap((page) => page.events) ?? [], [data?.pages]);

  return {
    events,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
