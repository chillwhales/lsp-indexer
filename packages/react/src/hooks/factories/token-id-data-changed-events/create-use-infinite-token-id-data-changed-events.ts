/** @see createUseInfinite */
import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import { tokenIdDataChangedEventKeys } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseInfiniteTokenIdDataChangedEventsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteTokenIdDataChangedEventsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type TokenIdDataChangedEventsInfiniteParams = UseInfiniteTokenIdDataChangedEventsParams & {
  include?: TokenIdDataChangedEventInclude;
};

export function createUseInfiniteTokenIdDataChangedEvents(
  queryFn: (
    params: TokenIdDataChangedEventsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>,
) {
  const impl = createUseInfinite<
    TokenIdDataChangedEventsInfiniteParams,
    PartialTokenIdDataChangedEvent,
    FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>
  >({
    queryKey: (p) => tokenIdDataChangedEventKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.tokenIdDataChangedEvents,
  });

  function useInfiniteTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
    params: UseInfiniteTokenIdDataChangedEventsParams & { include: I },
  ): UseInfiniteTokenIdDataChangedEventsReturn<TokenIdDataChangedEventResult<I>>;
  function useInfiniteTokenIdDataChangedEvents(
    params?: Omit<UseInfiniteTokenIdDataChangedEventsParams, 'include'> & { include?: never },
  ): UseInfiniteTokenIdDataChangedEventsReturn<TokenIdDataChangedEvent>;
  function useInfiniteTokenIdDataChangedEvents(
    params: UseInfiniteTokenIdDataChangedEventsParams & {
      include?: TokenIdDataChangedEventInclude;
    },
  ): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent>;
  function useInfiniteTokenIdDataChangedEvents(
    params: UseInfiniteTokenIdDataChangedEventsParams & {
      include?: TokenIdDataChangedEventInclude;
    } = {},
  ): UseInfiniteTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent> {
    const { items, ...rest } = impl(params);
    return { tokenIdDataChangedEvents: items, ...rest };
  }

  return useInfiniteTokenIdDataChangedEvents;
}
