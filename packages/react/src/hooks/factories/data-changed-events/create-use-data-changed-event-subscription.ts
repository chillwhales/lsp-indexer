/**
 * Factory for useDataChangedEventSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseDataChangedEventSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildDataChangedEventSubscriptionConfig` in the node service layer.
 *
 * EVENT domain — defaults to block-order desc sort when no sort is provided.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildDataChangedEventSubscriptionConfig — node service that builds the subscription config
 */
import { buildDataChangedEventSubscriptionConfig, dataChangedEventKeys } from '@lsp-indexer/node';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import type { UseDataChangedEventSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useDataChangedEventSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseDataChangedEventSubscription(useSubscription: UseSubscriptionFn) {
  function useDataChangedEventSubscription<const I extends DataChangedEventInclude>(
    params: UseDataChangedEventSubscriptionParams & {
      include: I;
      onData?: (data: DataChangedEventResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<DataChangedEventResult<I>>;
  function useDataChangedEventSubscription(
    params?: Omit<UseDataChangedEventSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: DataChangedEvent[]) => void;
    },
  ): UseSubscriptionReturn<DataChangedEvent>;
  function useDataChangedEventSubscription(
    params: UseDataChangedEventSubscriptionParams & {
      include?: DataChangedEventInclude;
      onData?: (data: PartialDataChangedEvent[]) => void;
    },
  ): UseSubscriptionReturn<PartialDataChangedEvent>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useDataChangedEventSubscription(
    params: UseDataChangedEventSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialDataChangedEvent> {
    const {
      filter,
      sort,
      limit = DEFAULT_SUBSCRIPTION_LIMIT,
      include,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    const queryClient = useQueryClient();
    const config = buildDataChangedEventSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [dataChangedEventKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useDataChangedEventSubscription;
}
