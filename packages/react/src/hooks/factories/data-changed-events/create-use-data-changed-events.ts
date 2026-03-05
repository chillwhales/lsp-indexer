/**
 * Factory for useDataChangedEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseDataChangedEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchDataChangedEvents(getClientUrl(), p)`
 * - Next:  `(p) => getDataChangedEvents(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchDataChangedEventsResult } from '@lsp-indexer/node';
import { dataChangedEventKeys } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseDataChangedEventsParams,
} from '@lsp-indexer/types';
import type { UseDataChangedEventsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type DataChangedEventsListParams = UseDataChangedEventsParams & {
  include?: DataChangedEventInclude;
};

/**
 * Create a `useDataChangedEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for data changed event lists
 */
export function createUseDataChangedEvents(
  queryFn: (
    params: DataChangedEventsListParams,
  ) => Promise<FetchDataChangedEventsResult<PartialDataChangedEvent>>,
) {
  const impl = createUseList<
    DataChangedEventsListParams,
    PartialDataChangedEvent,
    FetchDataChangedEventsResult<PartialDataChangedEvent>
  >({
    queryKey: (p) => dataChangedEventKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.dataChangedEvents,
  });

  function useDataChangedEvents<const I extends DataChangedEventInclude>(
    params: UseDataChangedEventsParams & { include: I },
  ): UseDataChangedEventsReturn<DataChangedEventResult<I>>;
  function useDataChangedEvents(
    params?: Omit<UseDataChangedEventsParams, 'include'> & { include?: never },
  ): UseDataChangedEventsReturn<DataChangedEvent>;
  function useDataChangedEvents(
    params: UseDataChangedEventsParams & { include?: DataChangedEventInclude },
  ): UseDataChangedEventsReturn<PartialDataChangedEvent>;
  function useDataChangedEvents(
    params: UseDataChangedEventsParams & { include?: DataChangedEventInclude } = {},
  ): UseDataChangedEventsReturn<PartialDataChangedEvent> {
    const { items, ...rest } = impl(params);
    return { dataChangedEvents: items, ...rest };
  }

  return useDataChangedEvents;
}
