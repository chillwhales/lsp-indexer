'use client';

import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import { universalReceiverEventKeys } from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UseInfiniteUniversalReceiverEventsParams,
  UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';

import { getUniversalReceiverEvents } from '../../actions/universal-receiver-events';

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
 * Fetch a paginated list of universal receiver event records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useUniversalReceiverEvents`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ universalReceiverEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `universalReceiverEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useUniversalReceiverEvents } from '@lsp-indexer/next';
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
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: universalReceiverEventKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getUniversalReceiverEvents({ filter, sort, limit, offset, include })
        : getUniversalReceiverEvents({ filter, sort, limit, offset }),
  });

  const universalReceiverEvents = data?.universalReceiverEvents ?? [];
  return { universalReceiverEvents, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch universal receiver event records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteUniversalReceiverEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ universalReceiverEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened universalReceiverEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteUniversalReceiverEvents } from '@lsp-indexer/next';
 *
 * function InfiniteUniversalReceiverEventList({ address }: { address: string }) {
 *   const {
 *     universalReceiverEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteUniversalReceiverEvents({
 *     filter: { address },
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
  params: UseInfiniteUniversalReceiverEventsParams & {
    include?: UniversalReceiverEventInclude;
  },
): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent>;
export function useInfiniteUniversalReceiverEvents(
  params: UseInfiniteUniversalReceiverEventsParams & {
    include?: UniversalReceiverEventInclude;
  } = {},
): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent> {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: universalReceiverEventKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getUniversalReceiverEvents({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
            include,
          })
        : getUniversalReceiverEvents({
            filter,
            sort,
            limit: pageSize,
            offset: pageParam,
          }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.universalReceiverEvents.length < pageSize) {
        return undefined;
      }
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
