/** @see createUseInfinite */
import { type FetchDataChangedEventsResult, dataChangedEventKeys } from '@lsp-indexer/node';
import {
  type DataChangedEvent,
  type DataChangedEventInclude,
  type DataChangedEventResult,
  type PartialDataChangedEvent,
  type UseInfiniteDataChangedEventsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteDataChangedEventsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type DataChangedEventsInfiniteParams = UseInfiniteDataChangedEventsParams & {
  include?: DataChangedEventInclude;
};

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
