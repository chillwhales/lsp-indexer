import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchUniversalReceiverEvents,
  getClientUrl,
  universalReceiverKeys,
} from '@lsp-indexer/node';
import type {
  UseInfiniteUniversalReceiverEventsParams,
  UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';

/** Default number of events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of Universal Receiver events with filtering and sorting.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useQuery` hook. Supports
 * filtering by receiver address, sender address, type ID, and block number range.
 * Default sort is `block_number DESC` (newest events first).
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ events, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `events` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function EventList() {
 *   const { events, totalCount, isLoading } = useUniversalReceiverEvents({
 *     filter: { receiverAddress: '0x1234...' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} events found</p>
 *       {events.map((e) => (
 *         <div key={e.id}>{e.typeId}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUniversalReceiverEvents(params: UseUniversalReceiverEventsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: universalReceiverKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchUniversalReceiverEvents(url, { filter, sort, limit, offset }),
  });

  return {
    events: data?.events ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch Universal Receiver events with infinite scroll pagination.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useInfiniteQuery` hook with
 * offset-based pagination. Pages are automatically flattened into a single `events`
 * array. Uses a **separate query key namespace** from `useUniversalReceiverEvents`
 * to prevent cache corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ events, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened events array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function InfiniteEventList() {
 *   const {
 *     events,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteUniversalReceiverEvents({
 *     filter: { receiverAddress: '0x1234...' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {events.map((e) => (
 *         <div key={e.id}>{e.typeId}</div>
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
export function useInfiniteUniversalReceiverEvents(
  params: UseInfiniteUniversalReceiverEventsParams = {},
) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: universalReceiverKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchUniversalReceiverEvents(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.events.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
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
