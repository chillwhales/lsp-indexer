/** @see createUseSubscription */
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
