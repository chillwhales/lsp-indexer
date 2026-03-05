/**
 * Factory for useInfiniteTokenIdDataChangedEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteTokenIdDataChangedEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchTokenIdDataChangedEvents(getClientUrl(), p)`
 * - Next:  `(p) => getTokenIdDataChangedEvents(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
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

/** Params passed to the factory — matches UseInfiniteTokenIdDataChangedEventsParams with optional include */
type TokenIdDataChangedEventsInfiniteParams = UseInfiniteTokenIdDataChangedEventsParams & {
  include?: TokenIdDataChangedEventInclude;
};

/**
 * Create a `useInfiniteTokenIdDataChangedEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for token ID data changed event lists (with limit + offset)
 */
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
