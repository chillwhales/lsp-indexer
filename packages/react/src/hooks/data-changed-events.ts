import type {
  InfiniteData,
  QueryClient,
  UseInfiniteQueryResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import {
  buildDataChangedEventIncludeVars,
  buildDataChangedEventWhere,
  dataChangedEventKeys,
  DataChangedEventSubscriptionDocument,
  fetchDataChangedEvents,
  fetchLatestDataChangedEvent,
  getClientUrl,
  parseDataChangedEvents,
} from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseDataChangedEventsParams,
  UseInfiniteDataChangedEventsParams,
  UseLatestDataChangedEventParams,
} from '@lsp-indexer/types';

import type { UseSubscriptionReturn } from '../subscriptions/use-subscription';
import { useSubscription } from '../subscriptions/use-subscription';

/** Default number of data changed events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useLatestDataChangedEvent — single event + query state */
type UseLatestDataChangedEventReturn<F> = { dataChangedEvent: F | null } & Omit<
  UseQueryResult<F | null, Error>,
  'data'
>;

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
 * Fetch the most recent ERC725Y DataChanged event matching the given filter.
 *
 * Wraps `fetchLatestDataChangedEvent` in a TanStack `useQuery` hook. Internally
 * sorts by timestamp descending and returns the first result. Useful for getting
 * the current value of a specific ERC725Y data key for a given address.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Filter and optional include config
 * @returns `{ dataChangedEvent, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `dataChangedEvent`
 *
 * @example
 * ```tsx
 * import { useLatestDataChangedEvent } from '@lsp-indexer/react';
 *
 * function LatestProfileChange({ address }: { address: string }) {
 *   const { dataChangedEvent, isLoading } = useLatestDataChangedEvent({
 *     filter: { address, dataKeyName: 'LSP3Profile' },
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!dataChangedEvent) return <p>No data change found</p>;
 *
 *   return <p>Latest value: {dataChangedEvent.dataValue}</p>;
 * }
 * ```
 */
export function useLatestDataChangedEvent<const I extends DataChangedEventInclude>(
  params: UseLatestDataChangedEventParams & { include: I },
): UseLatestDataChangedEventReturn<DataChangedEventResult<I>>;
export function useLatestDataChangedEvent(
  params?: Omit<UseLatestDataChangedEventParams, 'include'> & { include?: never },
): UseLatestDataChangedEventReturn<DataChangedEvent>;
export function useLatestDataChangedEvent(
  params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude },
): UseLatestDataChangedEventReturn<PartialDataChangedEvent>;
export function useLatestDataChangedEvent(
  params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude } = {},
): UseLatestDataChangedEventReturn<PartialDataChangedEvent> {
  const url = getClientUrl();
  const { filter, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: dataChangedEventKeys.latest(filter, include),
    queryFn: () =>
      include
        ? fetchLatestDataChangedEvent(url, { filter, include })
        : fetchLatestDataChangedEvent(url, { filter }),
  });

  const dataChangedEvent = data ?? null;
  return { dataChangedEvent, ...rest };
}

/**
 * Fetch a paginated list of ERC725Y DataChanged event records with filtering and sorting.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, dataKey, dataKeyName, blockNumber, timestamp, universalProfileName,
 * digitalAssetName) and sorting (by timestamp, blockNumber, universalProfileName,
 * digitalAssetName).
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
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
 *     filter: { address, dataKeyName: 'LSP3Profile' },
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
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
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
 *     filter: { address, dataKeyName: 'LSP3Profile' },
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

// ---------------------------------------------------------------------------
// Subscription hook
// ---------------------------------------------------------------------------

const DEFAULT_SUBSCRIPTION_LIMIT = 10;

interface UseDataChangedEventSubscriptionParams {
  filter?: DataChangedEventFilter;
  include?: DataChangedEventInclude;
  limit?: number;
  enabled?: boolean;
  invalidate?: boolean;
  onData?: (data: DataChangedEvent[]) => void;
  onReconnect?: () => void;
}

export function useDataChangedEventSubscription(
  params: UseDataChangedEventSubscriptionParams = {},
): UseSubscriptionReturn<DataChangedEvent> {
  const {
    filter,
    include,
    limit = DEFAULT_SUBSCRIPTION_LIMIT,
    enabled = true,
    invalidate = false,
    onData,
    onReconnect,
  } = params;

  const where = buildDataChangedEventWhere(filter);
  const includeVars = buildDataChangedEventIncludeVars(include);

  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider
  }

  return useSubscription({
    document: DataChangedEventSubscriptionDocument,
    dataKey: 'data_changed',
    variables: {
      where: Object.keys(where).length > 0 ? where : undefined,
      order_by: undefined,
      limit,
      ...includeVars,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: (raw: any[]) => parseDataChangedEvents(raw),
    enabled,
    invalidate,
    invalidateKeys: invalidate ? [dataChangedEventKeys.all] : undefined,
    queryClient: invalidate ? queryClient : undefined,
    onData,
    onReconnect,
  });
}
