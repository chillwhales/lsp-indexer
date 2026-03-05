/**
 * Factory for useTokenIdDataChangedEvents — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseTokenIdDataChangedEvents(queryFn)` with its own fetch:
 * - React: `(p) => fetchTokenIdDataChangedEvents(getClientUrl(), p)`
 * - Next:  `(p) => getTokenIdDataChangedEvents(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchTokenIdDataChangedEventsResult } from '@lsp-indexer/node';
import { tokenIdDataChangedEventKeys } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseTokenIdDataChangedEventsParams,
} from '@lsp-indexer/types';
import type { UseTokenIdDataChangedEventsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type TokenIdDataChangedEventsListParams = UseTokenIdDataChangedEventsParams & {
  include?: TokenIdDataChangedEventInclude;
};

/**
 * Create a `useTokenIdDataChangedEvents` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for token ID data changed event lists
 */
export function createUseTokenIdDataChangedEvents(
  queryFn: (
    params: TokenIdDataChangedEventsListParams,
  ) => Promise<FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>>,
) {
  const impl = createUseList<
    TokenIdDataChangedEventsListParams,
    PartialTokenIdDataChangedEvent,
    FetchTokenIdDataChangedEventsResult<PartialTokenIdDataChangedEvent>
  >({
    queryKey: (p) =>
      tokenIdDataChangedEventKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.tokenIdDataChangedEvents,
  });

  function useTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
    params: UseTokenIdDataChangedEventsParams & { include: I },
  ): UseTokenIdDataChangedEventsReturn<TokenIdDataChangedEventResult<I>>;
  function useTokenIdDataChangedEvents(
    params?: Omit<UseTokenIdDataChangedEventsParams, 'include'> & { include?: never },
  ): UseTokenIdDataChangedEventsReturn<TokenIdDataChangedEvent>;
  function useTokenIdDataChangedEvents(
    params: UseTokenIdDataChangedEventsParams & { include?: TokenIdDataChangedEventInclude },
  ): UseTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent>;
  function useTokenIdDataChangedEvents(
    params: UseTokenIdDataChangedEventsParams & { include?: TokenIdDataChangedEventInclude } = {},
  ): UseTokenIdDataChangedEventsReturn<PartialTokenIdDataChangedEvent> {
    const { items, ...rest } = impl(params);
    return { tokenIdDataChangedEvents: items, ...rest };
  }

  return useTokenIdDataChangedEvents;
}
