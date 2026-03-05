/**
 * Factory for useInfiniteDataChangedEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteDataChangedEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchDataChangedEvents(getClientUrl(), p)`
 * - Next:  `(p) => getDataChangedEvents(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import { dataChangedEventKeys } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseInfiniteDataChangedEventsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteDataChangedEventsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteDataChangedEventsParams with optional include */
type DataChangedEventsInfiniteParams = UseInfiniteDataChangedEventsParams & {
  include?: DataChangedEventInclude;
};

/**
 * Create a `useInfiniteDataChangedEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for data changed event lists (with limit + offset)
 */
export function createUseInfiniteDataChangedEvents(
  queryFn: (
    params: DataChangedEventsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>>,
) {
  const impl = createUseInfinite<
    DataChangedEventsInfiniteParams,
    PartialDataChangedEvent,
    FetchDataChangedEventsResult<PartialDataChangedEvent>
  >({
    queryKey: (p) => dataChangedEventKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.dataChangedEvents,
  });

  function useInfiniteDataChangedEvents<const I extends DataChangedEventInclude>(
    params: UseInfiniteDataChangedEventsParams & { include: I },
  ): UseInfiniteDataChangedEventsReturn<DataChangedEventResult<I>>;
  function useInfiniteDataChangedEvents(
    params?: Omit<UseInfiniteDataChangedEventsParams, 'include'> & { include?: never },
  ): UseInfiniteDataChangedEventsReturn<DataChangedEvent>;
  function useInfiniteDataChangedEvents(
    params: UseInfiniteDataChangedEventsParams & { include?: DataChangedEventInclude },
  ): UseInfiniteDataChangedEventsReturn<PartialDataChangedEvent>;
  function useInfiniteDataChangedEvents(
    params: UseInfiniteDataChangedEventsParams & { include?: DataChangedEventInclude } = {},
  ): UseInfiniteDataChangedEventsReturn<PartialDataChangedEvent> {
    const { items, ...rest } = impl(params);
    return { dataChangedEvents: items, ...rest };
  }

  return useInfiniteDataChangedEvents;
}
