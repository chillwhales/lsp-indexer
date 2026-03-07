/** @see createUseList */
import {
  type FetchUniversalReceiverEventsResult,
  universalReceiverEventKeys,
} from '@lsp-indexer/node';
import {
  type PartialUniversalReceiverEvent,
  type UniversalReceiverEvent,
  type UniversalReceiverEventInclude,
  type UniversalReceiverEventResult,
  type UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';
import { type UseUniversalReceiverEventsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type UniversalReceiverEventsListParams = UseUniversalReceiverEventsParams & {
  include?: UniversalReceiverEventInclude;
};

export function createUseUniversalReceiverEvents(
  queryFn: (
    params: UniversalReceiverEventsListParams,
  ) => Promise<FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>>,
) {
  const impl = createUseList<
    UniversalReceiverEventsListParams,
    PartialUniversalReceiverEvent,
    FetchUniversalReceiverEventsResult<PartialUniversalReceiverEvent>
  >({
    queryKey: (p) =>
      universalReceiverEventKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.universalReceiverEvents,
  });

  function useUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
    params: UseUniversalReceiverEventsParams & { include: I },
  ): UseUniversalReceiverEventsReturn<UniversalReceiverEventResult<I>>;
  function useUniversalReceiverEvents(
    params?: Omit<UseUniversalReceiverEventsParams, 'include'> & { include?: never },
  ): UseUniversalReceiverEventsReturn<UniversalReceiverEvent>;
  function useUniversalReceiverEvents(
    params: UseUniversalReceiverEventsParams & { include?: UniversalReceiverEventInclude },
  ): UseUniversalReceiverEventsReturn<PartialUniversalReceiverEvent>;
  function useUniversalReceiverEvents(
    params: UseUniversalReceiverEventsParams & { include?: UniversalReceiverEventInclude } = {},
  ): UseUniversalReceiverEventsReturn<PartialUniversalReceiverEvent> {
    const { items, ...rest } = impl(params);
    return { universalReceiverEvents: items, ...rest };
  }

  return useUniversalReceiverEvents;
}
