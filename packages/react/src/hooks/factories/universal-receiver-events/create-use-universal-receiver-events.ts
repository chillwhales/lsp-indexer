/**
 * Factory for useUniversalReceiverEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseUniversalReceiverEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchUniversalReceiverEvents(getClientUrl(), p)`
 * - Next:  `(p) => getUniversalReceiverEvents(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchUniversalReceiverEventsResult } from '@lsp-indexer/node';
import { universalReceiverEventKeys } from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UseUniversalReceiverEventsParams,
} from '@lsp-indexer/types';
import type { UseUniversalReceiverEventsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type UniversalReceiverEventsListParams = UseUniversalReceiverEventsParams & {
  include?: UniversalReceiverEventInclude;
};

/**
 * Create a `useUniversalReceiverEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for universal receiver event lists
 */
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
