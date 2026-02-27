import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import {
  UniversalReceiverEventSubscriptionDocument,
  buildUniversalReceiverEventIncludeVars,
  buildUniversalReceiverEventWhere,
  fetchUniversalReceiverEvents,
  getClientUrl,
  parseUniversalReceiverEvents,
  universalReceiverEventKeys,
} from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UseInfiniteUniversalReceiverEventsParams,
  UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';

import type { UseSubscriptionReturn } from '../subscriptions/use-subscription';
import { useSubscription } from '../subscriptions/use-subscription';

/** Default number of universal receiver events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useUniversalReceiverEvents — universalReceiverEvents array + totalCount + query state */
type UseUniversalReceiverEventsReturn<F> = {
  universalReceiverEvents: F[];
  totalCount: number;
} & Omit<UseQueryResult<FetchUniversalReceiverEventsResult<F>, Error>, 'data'>;

/** Flat return shape for useInfiniteUniversalReceiverEvents — universalReceiverEvents array + infinite scroll controls + query state */
type UseInfiniteUniversalReceiverEventsReturn<F> = {
  universalReceiverEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchUniversalReceiverEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a paginated list of universal receiver event records with filtering and sorting.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, from, typeId, timestamp, blockNumber, universalProfileName,
 * fromProfileName, fromAssetName) and sorting (by timestamp, blockNumber,
 * universalProfileName, fromProfileName, fromAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ universalReceiverEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `universalReceiverEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function UniversalReceiverEventList({ address }: { address: string }) {
 *   const { universalReceiverEvents, totalCount, isLoading } = useUniversalReceiverEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} universal receiver events</p>
 *       {universalReceiverEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.from}-${evt.typeId}`}>
 *           {evt.typeId}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
  params: UseUniversalReceiverEventsParams & { include: I },
): UseUniversalReceiverEventsReturn<UniversalReceiverEventResult<I>>;
export function useUniversalReceiverEvents(
  params?: Omit<UseUniversalReceiverEventsParams, 'include'> & { include?: never },
): UseUniversalReceiverEventsReturn<UniversalReceiverEvent>;
export function useUniversalReceiverEvents(
  params: UseUniversalReceiverEventsParams & { include?: UniversalReceiverEventInclude },
): UseUniversalReceiverEventsReturn<PartialUniversalReceiverEvent>;
export function useUniversalReceiverEvents(
  params: UseUniversalReceiverEventsParams & { include?: UniversalReceiverEventInclude } = {},
): UseUniversalReceiverEventsReturn<PartialUniversalReceiverEvent> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: universalReceiverEventKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchUniversalReceiverEvents(url, { filter, sort, limit, offset, include })
        : fetchUniversalReceiverEvents(url, { filter, sort, limit, offset }),
  });

  const universalReceiverEvents = data?.universalReceiverEvents ?? [];
  return { universalReceiverEvents, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch universal receiver event records with infinite scroll pagination.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `universalReceiverEvents` array.
 * Uses a **separate query key namespace** from `useUniversalReceiverEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ universalReceiverEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened universalReceiverEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function InfiniteUniversalReceiverEventList({ address }: { address: string }) {
 *   const {
 *     universalReceiverEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteUniversalReceiverEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {universalReceiverEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.from}-${evt.typeId}`}>
 *           {evt.typeId}
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
export function useInfiniteUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
  params: UseInfiniteUniversalReceiverEventsParams & { include: I },
): UseInfiniteUniversalReceiverEventsReturn<UniversalReceiverEventResult<I>>;
export function useInfiniteUniversalReceiverEvents(
  params?: Omit<UseInfiniteUniversalReceiverEventsParams, 'include'> & { include?: never },
): UseInfiniteUniversalReceiverEventsReturn<UniversalReceiverEvent>;
export function useInfiniteUniversalReceiverEvents(
  params: UseInfiniteUniversalReceiverEventsParams & { include?: UniversalReceiverEventInclude },
): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent>;
export function useInfiniteUniversalReceiverEvents(
  params: UseInfiniteUniversalReceiverEventsParams & {
    include?: UniversalReceiverEventInclude;
  } = {},
): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: universalReceiverEventKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchUniversalReceiverEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchUniversalReceiverEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.universalReceiverEvents.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single universalReceiverEvents array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const universalReceiverEvents = useMemo(
    () => data?.pages.flatMap((page) => page.universalReceiverEvents) ?? [],
    [data?.pages],
  );

  return {
    universalReceiverEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Subscription hook
// ---------------------------------------------------------------------------

/** Default number of universal receiver events for subscription queries */
const DEFAULT_SUBSCRIPTION_LIMIT = 10;

/** Options for useUniversalReceiverEventSubscription */
interface UseUniversalReceiverEventSubscriptionOptions {
  filter?: UniversalReceiverEventFilter;
  include?: UniversalReceiverEventInclude;
  limit?: number;
  enabled?: boolean;
  invalidate?: boolean;
  onData?: (data: PartialUniversalReceiverEvent[]) => void;
  onReconnect?: () => void;
}

/**
 * Subscribe to real-time universal receiver event updates via WebSocket.
 *
 * Wraps the generic `useSubscription` hook with universal receiver event-specific
 * document, parser, and query key invalidation.
 *
 * @param options - Subscription options (filter, include, limit, enabled, callbacks)
 * @returns `{ data, isConnected, isSubscribed, error }` — subscription state
 */
export function useUniversalReceiverEventSubscription(
  options: UseUniversalReceiverEventSubscriptionOptions = {},
): UseSubscriptionReturn<PartialUniversalReceiverEvent> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled,
    invalidate,
    onData,
    onReconnect,
  } = options;

  const where = buildUniversalReceiverEventWhere(filter);
  const includeVars = buildUniversalReceiverEventIncludeVars(include);

  let queryClient;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — invalidation will be skipped
  }

  return useSubscription({
    document: UniversalReceiverEventSubscriptionDocument,
    dataKey: 'universal_receiver',
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: [{ block_number: 'desc' }, { transaction_index: 'desc' }, { log_index: 'desc' }],
      limit,
      ...includeVars,
    },
    parser: (raw: any[]) => parseUniversalReceiverEvents(raw),
    enabled,
    invalidate,
    invalidateKeys: [universalReceiverEventKeys.all],
    queryClient,
    onData,
    onReconnect,
  });
}
