/** @see createUseSubscription */
import {
  buildUniversalReceiverEventSubscriptionConfig,
  universalReceiverEventKeys,
} from '@lsp-indexer/node';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import type { UseSubscriptionFn, UseUniversalReceiverEventSubscriptionParams } from '../../types';

export function createUseUniversalReceiverEventSubscription(useSubscription: UseSubscriptionFn) {
  function useUniversalReceiverEventSubscription<const I extends UniversalReceiverEventInclude>(
    params: UseUniversalReceiverEventSubscriptionParams & {
      include: I;
      onData?: (data: UniversalReceiverEventResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<UniversalReceiverEventResult<I>>;
  function useUniversalReceiverEventSubscription(
    params?: Omit<UseUniversalReceiverEventSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: UniversalReceiverEvent[]) => void;
    },
  ): UseSubscriptionReturn<UniversalReceiverEvent>;
  function useUniversalReceiverEventSubscription(
    params: UseUniversalReceiverEventSubscriptionParams & {
      include?: UniversalReceiverEventInclude;
      onData?: (data: PartialUniversalReceiverEvent[]) => void;
    },
  ): UseSubscriptionReturn<PartialUniversalReceiverEvent>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useUniversalReceiverEventSubscription(
    params: UseUniversalReceiverEventSubscriptionParams & {
      onData?: (data: any[]) => void;
    } = {},
  ): UseSubscriptionReturn<PartialUniversalReceiverEvent> {
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
    const config = buildUniversalReceiverEventSubscriptionConfig({
      filter,
      sort,
      limit,
      include,
    });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [universalReceiverEventKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useUniversalReceiverEventSubscription;
}
