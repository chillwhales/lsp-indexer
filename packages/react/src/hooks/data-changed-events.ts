import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import { dataChangedEventKeys, fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseDataChangedEventsParams,
  UseInfiniteDataChangedEventsParams,
} from '@lsp-indexer/types';

/** Default number of data changed events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useDataChangedEvents — dataChangedEvents array + totalCount + query state */
type UseDataChangedEventsReturn<F> = { dataChangedEvents: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchDataChangedEventsResult<F>, Error>,
  'data'
>;

/** Flat return shape for useInfiniteDataChangedEvents — dataChangedEvents array + infinite scroll controls + query state */
type UseInfiniteDataChangedEventsReturn<F> = {
  dataChangedEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchDataChangedEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a paginated list of ERC725Y DataChanged event records with filtering and sorting.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, dataKey, blockNumber, timestamp) and sorting (by timestamp,
 * address, dataKey, blockNumber).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ dataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `dataChangedEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDataChangedEvents } from '@lsp-indexer/react';
 *
 * function DataChangedEventList({ address }: { address: string }) {
 *   const { dataChangedEvents, totalCount, isLoading } = useDataChangedEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} data changed events</p>
 *       {dataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.dataKey}`}>
 *           {evt.dataKeyName ?? evt.dataKey}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDataChangedEvents<const I extends DataChangedEventInclude>(
  params: UseDataChangedEventsParams & { include: I },
): UseDataChangedEventsReturn<DataChangedEventResult<I>>;
export function useDataChangedEvents(
  params?: Omit<UseDataChangedEventsParams, 'include'> & { include?: never },
): UseDataChangedEventsReturn<DataChangedEvent>;
export function useDataChangedEvents(
  params: UseDataChangedEventsParams & { include?: DataChangedEventInclude },
): UseDataChangedEventsReturn<PartialDataChangedEvent>;
export function useDataChangedEvents(
  params: UseDataChangedEventsParams & { include?: DataChangedEventInclude } = {},
): UseDataChangedEventsReturn<PartialDataChangedEvent> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: dataChangedEventKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchDataChangedEvents(url, { filter, sort, limit, offset, include })
        : fetchDataChangedEvents(url, { filter, sort, limit, offset }),
  });

  const dataChangedEvents = data?.dataChangedEvents ?? [];
  return { dataChangedEvents, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch ERC725Y DataChanged event records with infinite scroll pagination.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `dataChangedEvents` array.
 * Uses a **separate query key namespace** from `useDataChangedEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ dataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened dataChangedEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDataChangedEvents } from '@lsp-indexer/react';
 *
 * function InfiniteDataChangedEventList({ address }: { address: string }) {
 *   const {
 *     dataChangedEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteDataChangedEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {dataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.dataKey}`}>
 *           {evt.dataKeyName ?? evt.dataKey}
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
export function useInfiniteDataChangedEvents<const I extends DataChangedEventInclude>(
  params: UseInfiniteDataChangedEventsParams & { include: I },
): UseInfiniteDataChangedEventsReturn<DataChangedEventResult<I>>;
export function useInfiniteDataChangedEvents(
  params?: Omit<UseInfiniteDataChangedEventsParams, 'include'> & { include?: never },
): UseInfiniteDataChangedEventsReturn<DataChangedEvent>;
export function useInfiniteDataChangedEvents(
  params: UseInfiniteDataChangedEventsParams & { include?: DataChangedEventInclude },
): UseInfiniteDataChangedEventsReturn<PartialDataChangedEvent>;
export function useInfiniteDataChangedEvents(
  params: UseInfiniteDataChangedEventsParams & { include?: DataChangedEventInclude } = {},
): UseInfiniteDataChangedEventsReturn<PartialDataChangedEvent> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: dataChangedEventKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchDataChangedEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchDataChangedEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.dataChangedEvents.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single dataChangedEvents array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const dataChangedEvents = useMemo(
    () => data?.pages.flatMap((page) => page.dataChangedEvents) ?? [],
    [data?.pages],
  );

  return {
    dataChangedEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
