import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { universalReceiverKeys } from '@lsp-indexer/node';
import type {
  UseInfiniteUniversalReceiverEventsParams,
  UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';

import { getUniversalReceiverEvents } from '../actions/universal-receiver';

/** Default number of events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of Universal Receiver events via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useUniversalReceiverEvents`, but routes
 * the request through a server action instead of calling Hasura directly from the
 * browser. This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ events, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `events` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useUniversalReceiverEvents } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: universalReceiverKeys.list(filter, sort, limit, offset),
    queryFn: () => getUniversalReceiverEvents({ filter, sort, limit, offset }),
  });

  return {
    events: data?.events ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch Universal Receiver events with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteUniversalReceiverEvents`, but
 * routes the request through a server action instead of calling Hasura directly from
 * the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ events, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened events array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteUniversalReceiverEvents } from '@lsp-indexer/next';
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
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: universalReceiverKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getUniversalReceiverEvents({
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
