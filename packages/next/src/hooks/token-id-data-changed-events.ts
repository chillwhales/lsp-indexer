import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import { tokenIdDataChangedEventKeys } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseInfiniteTokenIdDataChangedEventsParams,
  UseTokenIdDataChangedEventsParams,
} from '@lsp-indexer/types';

import { getTokenIdDataChangedEvents } from '../actions/token-id-data-changed-events';

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
 * Fetch a paginated list of ERC725Y TokenIdDataChanged event records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useTokenIdDataChangedEvents`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ tokenIdDataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `tokenIdDataChangedEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useTokenIdDataChangedEvents } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: tokenIdDataChangedEventKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getTokenIdDataChangedEvents({ filter, sort, limit, offset, include })
        : getTokenIdDataChangedEvents({ filter, sort, limit, offset }),
  });

  const tokenIdDataChangedEvents = data?.tokenIdDataChangedEvents ?? [];
  return { tokenIdDataChangedEvents, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch ERC725Y TokenIdDataChanged event records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteTokenIdDataChangedEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ tokenIdDataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened tokenIdDataChangedEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/next';
 *
 * function InfiniteTokenIdDataChangedEventList({ address }: { address: string }) {
 *   const {
 *     tokenIdDataChangedEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteTokenIdDataChangedEvents({
 *     filter: { address },
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
  params: UseInfiniteTokenIdDataChangedEventsParams & {
    include?: TokenIdDataChangedEventInclude;
  },
): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent>;
export function useInfiniteTokenIdDataChangedEvents(
  params: UseInfiniteTokenIdDataChangedEventsParams & {
    include?: TokenIdDataChangedEventInclude;
  } = {},
): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: tokenIdDataChangedEventKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getTokenIdDataChangedEvents({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : getTokenIdDataChangedEvents({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.tokenIdDataChangedEvents.length < pageSize) {
        return undefined;
      }
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
