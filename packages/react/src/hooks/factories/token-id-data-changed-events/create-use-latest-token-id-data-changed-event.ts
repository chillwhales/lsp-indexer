/**
 * Factory for useLatestTokenIdDataChangedEvent — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseLatestTokenIdDataChangedEvent(queryFn)` with its own fetch:
 * - React: `(p) => fetchLatestTokenIdDataChangedEvent(getClientUrl(), p)`
 * - Next:  `(p) => getLatestTokenIdDataChangedEvent(p)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { tokenIdDataChangedEventKeys } from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseLatestTokenIdDataChangedEventParams,
} from '@lsp-indexer/types';
import type { UseLatestTokenIdDataChangedEventReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — filter + optional include */
type LatestTokenIdDataChangedEventParams = UseLatestTokenIdDataChangedEventParams & {
  include?: TokenIdDataChangedEventInclude;
};

/**
 * Create a `useLatestTokenIdDataChangedEvent` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for the latest token ID data changed event
 */
export function createUseLatestTokenIdDataChangedEvent(
  queryFn: (
    params: LatestTokenIdDataChangedEventParams,
  ) => Promise<PartialTokenIdDataChangedEvent | null>,
) {
  const impl = createUseDetail<LatestTokenIdDataChangedEventParams, PartialTokenIdDataChangedEvent>(
    {
      queryKey: (p) => tokenIdDataChangedEventKeys.latest(p.filter, p.include),
      queryFn,
      enabled: () => true,
    },
  );

  function useLatestTokenIdDataChangedEvent<const I extends TokenIdDataChangedEventInclude>(
    params: UseLatestTokenIdDataChangedEventParams & { include: I },
  ): UseLatestTokenIdDataChangedEventReturn<TokenIdDataChangedEventResult<I>>;
  function useLatestTokenIdDataChangedEvent(
    params?: Omit<UseLatestTokenIdDataChangedEventParams, 'include'> & { include?: never },
  ): UseLatestTokenIdDataChangedEventReturn<TokenIdDataChangedEvent>;
  function useLatestTokenIdDataChangedEvent(
    params: UseLatestTokenIdDataChangedEventParams & {
      include?: TokenIdDataChangedEventInclude;
    },
  ): UseLatestTokenIdDataChangedEventReturn<PartialTokenIdDataChangedEvent>;
  function useLatestTokenIdDataChangedEvent(
    params: UseLatestTokenIdDataChangedEventParams & {
      include?: TokenIdDataChangedEventInclude;
    } = {},
  ): UseLatestTokenIdDataChangedEventReturn<PartialTokenIdDataChangedEvent> {
    const { data, ...rest } = impl(params);
    return { tokenIdDataChangedEvent: data, ...rest };
  }

  return useLatestTokenIdDataChangedEvent;
}
