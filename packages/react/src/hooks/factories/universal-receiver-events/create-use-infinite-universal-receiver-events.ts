/** @see createUseInfinite */
import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import { universalReceiverEventKeys } from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UseInfiniteUniversalReceiverEventsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteUniversalReceiverEventsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type UniversalReceiverEventsInfiniteParams = UseInfiniteUniversalReceiverEventsParams & {
  include?: UniversalReceiverEventInclude;
};

export function createUseInfiniteUniversalReceiverEvents(
  queryFn: (
    params: UniversalReceiverEventsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>>,
) {
  const impl = createUseInfinite<
    UniversalReceiverEventsInfiniteParams,
    PartialUniversalReceiverEvent,
    FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>
  >({
    queryKey: (p) => universalReceiverEventKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.universalReceiverEvents,
  });

  function useInfiniteUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
    params: UseInfiniteUniversalReceiverEventsParams & { include: I },
  ): UseInfiniteUniversalReceiverEventsReturn<UniversalReceiverEventResult<I>>;
  function useInfiniteUniversalReceiverEvents(
    params?: Omit<UseInfiniteUniversalReceiverEventsParams, 'include'> & { include?: never },
  ): UseInfiniteUniversalReceiverEventsReturn<UniversalReceiverEvent>;
  function useInfiniteUniversalReceiverEvents(
    params: UseInfiniteUniversalReceiverEventsParams & {
      include?: UniversalReceiverEventInclude;
    },
  ): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent>;
  function useInfiniteUniversalReceiverEvents(
    params: UseInfiniteUniversalReceiverEventsParams & {
      include?: UniversalReceiverEventInclude;
    } = {},
  ): UseInfiniteUniversalReceiverEventsReturn<PartialUniversalReceiverEvent> {
    const { items, ...rest } = impl(params);
    return { universalReceiverEvents: items, ...rest };
  }

  return useInfiniteUniversalReceiverEvents;
}
