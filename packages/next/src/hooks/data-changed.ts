import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { dataChangedKeys } from '@lsp-indexer/node';
import type {
  UseDataChangedEventsParams,
  UseInfiniteDataChangedEventsParams,
} from '@lsp-indexer/types';

import { getDataChangedEvents } from '../actions/data-changed';

/** Default number of events per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a paginated list of ERC725 data change events via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDataChangedEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ events, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `events` and `totalCount`
 */
export function useDataChangedEvents(params: UseDataChangedEventsParams = {}) {
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: dataChangedKeys.list(filter, sort, limit, offset),
    queryFn: () => getDataChangedEvents({ filter, sort, limit, offset }),
  });

  return {
    events: data?.events ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch ERC725 data change events with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDataChangedEvents`, but routes
 * the request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ events, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened events array with infinite scroll controls
 */
export function useInfiniteDataChangedEvents(params: UseInfiniteDataChangedEventsParams = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: dataChangedKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getDataChangedEvents({
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
