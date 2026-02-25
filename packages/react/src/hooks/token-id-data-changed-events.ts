import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import {
  fetchTokenIdDataChangedEvents,
  getClientUrl,
  tokenIdDataChangedEventKeys,
} from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseInfiniteTokenIdDataChangedEventsParams,
  UseTokenIdDataChangedEventsParams,
} from '@lsp-indexer/types';

/** Default number of token ID data changed events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/** Flat return shape for useTokenIdDataChangedEvents — tokenIdDataChangedEvents array + totalCount + query state */
type UseTokenIdDataChangedEventsReturn<F> = {
  tokenIdDataChangedEvents: F[];
  totalCount: number;
} & Omit<UseQueryResult<FetchTokenIdDataChangedEventsResult<F>, Error>, 'data'>;

/** Flat return shape for useInfiniteTokenIdDataChangedEvents — tokenIdDataChangedEvents array + infinite scroll controls + query state */
type UseInfiniteTokenIdDataChangedEventsReturn<F> = {
  tokenIdDataChangedEvents: F[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<FetchTokenIdDataChangedEventsResult<F>>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Fetch a paginated list of ERC725Y TokenIdDataChanged event records with filtering and sorting.
 *
 * Wraps `fetchTokenIdDataChangedEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, dataKey, tokenId, blockNumber, timestamp, digitalAssetName,
 * nftName) and sorting (by timestamp, blockNumber, digitalAssetName, nftName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ tokenIdDataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `tokenIdDataChangedEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useTokenIdDataChangedEvents } from '@lsp-indexer/react';
 *
 * function TokenIdDataChangedEventList({ address }: { address: string }) {
 *   const { tokenIdDataChangedEvents, totalCount, isLoading } = useTokenIdDataChangedEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} token ID data changed events</p>
 *       {tokenIdDataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.tokenId}-${evt.dataKey}`}>
 *           {evt.tokenId}: {evt.dataKeyName ?? evt.dataKey}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
  params: UseTokenIdDataChangedEventsParams & { include: I },
): UseTokenIdDataChangedEventsReturn<TokenIdDataChangedEventResult<I>>;
export function useTokenIdDataChangedEvents(
  params?: Omit<UseTokenIdDataChangedEventsParams, 'include'> & { include?: never },
): UseTokenIdDataChangedEventsReturn<TokenIdDataChangedEvent>;
export function useTokenIdDataChangedEvents(
  params: UseTokenIdDataChangedEventsParams & { include?: TokenIdDataChangedEventInclude },
): UseTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent>;
export function useTokenIdDataChangedEvents(
  params: UseTokenIdDataChangedEventsParams & { include?: TokenIdDataChangedEventInclude } = {},
): UseTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: tokenIdDataChangedEventKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchTokenIdDataChangedEvents(url, { filter, sort, limit, offset, include })
        : fetchTokenIdDataChangedEvents(url, { filter, sort, limit, offset }),
  });

  const tokenIdDataChangedEvents = data?.tokenIdDataChangedEvents ?? [];
  return { tokenIdDataChangedEvents, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch ERC725Y TokenIdDataChanged event records with infinite scroll pagination.
 *
 * Wraps `fetchTokenIdDataChangedEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `tokenIdDataChangedEvents` array.
 * Uses a **separate query key namespace** from `useTokenIdDataChangedEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ tokenIdDataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened tokenIdDataChangedEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';
 *
 * function InfiniteTokenIdDataChangedEventList({ address }: { address: string }) {
 *   const {
 *     tokenIdDataChangedEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteTokenIdDataChangedEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {tokenIdDataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.tokenId}-${evt.dataKey}`}>
 *           {evt.tokenId}: {evt.dataKeyName ?? evt.dataKey}
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
export function useInfiniteTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
  params: UseInfiniteTokenIdDataChangedEventsParams & { include: I },
): UseInfiniteTokenIdDataChangedEventsReturn<TokenIdDataChangedEventResult<I>>;
export function useInfiniteTokenIdDataChangedEvents(
  params?: Omit<UseInfiniteTokenIdDataChangedEventsParams, 'include'> & { include?: never },
): UseInfiniteTokenIdDataChangedEventsReturn<TokenIdDataChangedEvent>;
export function useInfiniteTokenIdDataChangedEvents(
  params: UseInfiniteTokenIdDataChangedEventsParams & { include?: TokenIdDataChangedEventInclude },
): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent>;
export function useInfiniteTokenIdDataChangedEvents(
  params: UseInfiniteTokenIdDataChangedEventsParams & {
    include?: TokenIdDataChangedEventInclude;
  } = {},
): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent> {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: tokenIdDataChangedEventKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? fetchTokenIdDataChangedEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : fetchTokenIdDataChangedEvents(url, {
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.tokenIdDataChangedEvents.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single tokenIdDataChangedEvents array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const tokenIdDataChangedEvents = useMemo(
    () => data?.pages.flatMap((page) => page.tokenIdDataChangedEvents) ?? [],
    [data?.pages],
  );

  return {
    tokenIdDataChangedEvents,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
