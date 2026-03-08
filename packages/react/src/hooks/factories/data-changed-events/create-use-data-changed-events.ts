/** @see createUseList */
import { type FetchDataChangedEventsResult, dataChangedEventKeys } from '@lsp-indexer/node';
import {
  type DataChangedEvent,
  type DataChangedEventInclude,
  type DataChangedEventResult,
  type PartialDataChangedEvent,
  type UseDataChangedEventsParams,
} from '@lsp-indexer/types';
import { type UseDataChangedEventsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type DataChangedEventsListParams = UseDataChangedEventsParams & {
  include?: DataChangedEventInclude;
};

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
