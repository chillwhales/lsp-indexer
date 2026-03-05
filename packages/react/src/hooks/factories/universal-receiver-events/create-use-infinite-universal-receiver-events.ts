/**
 * Factory for useInfiniteUniversalReceiverEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteUniversalReceiverEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchUniversalReceiverEvents(getClientUrl(), p)`
 * - Next:  `(p) => getUniversalReceiverEvents(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
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

/** Params passed to the factory — matches UseInfiniteUniversalReceiverEventsParams with optional include */
type UniversalReceiverEventsInfiniteParams = UseInfiniteUniversalReceiverEventsParams & {
  include?: UniversalReceiverEventInclude;
};

/**
 * Create a `useInfiniteUniversalReceiverEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for universal receiver event lists (with limit + offset)
 */
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
