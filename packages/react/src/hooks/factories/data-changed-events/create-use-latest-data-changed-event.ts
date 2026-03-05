/**
 * Factory for useLatestDataChangedEvent — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseLatestDataChangedEvent(queryFn)` with its own fetch:
 * - React: `(p) => fetchLatestDataChangedEvent(getClientUrl(), p)`
 * - Next:  `(p) => getLatestDataChangedEvent(p)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { dataChangedEventKeys } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseLatestDataChangedEventParams,
} from '@lsp-indexer/types';
import type { UseLatestDataChangedEventReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — filter + optional include */
type LatestDataChangedEventParams = UseLatestDataChangedEventParams & {
  include?: DataChangedEventInclude;
};

/**
 * Create a `useLatestDataChangedEvent` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for the latest data changed event
 */
export function createUseLatestDataChangedEvent(
  queryFn: (params: LatestDataChangedEventParams) => Promise<PartialDataChangedEvent | null>,
) {
  const impl = createUseDetail<LatestDataChangedEventParams, PartialDataChangedEvent>({
    queryKey: (p) => dataChangedEventKeys.latest(p.filter, p.include),
    queryFn,
    enabled: () => true,
  });

  function useLatestDataChangedEvent<const I extends DataChangedEventInclude>(
    params: UseLatestDataChangedEventParams & { include: I },
  ): UseLatestDataChangedEventReturn<DataChangedEventResult<I>>;
  function useLatestDataChangedEvent(
    params?: Omit<UseLatestDataChangedEventParams, 'include'> & { include?: never },
  ): UseLatestDataChangedEventReturn<DataChangedEvent>;
  function useLatestDataChangedEvent(
    params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude },
  ): UseLatestDataChangedEventReturn<PartialDataChangedEvent>;
  function useLatestDataChangedEvent(
    params: UseLatestDataChangedEventParams & { include?: DataChangedEventInclude } = {},
  ): UseLatestDataChangedEventReturn<PartialDataChangedEvent> {
    const { data, ...rest } = impl(params);
    return { dataChangedEvent: data, ...rest };
  }

  return useLatestDataChangedEvent;
}
