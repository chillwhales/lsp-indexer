/**
 * Factory for useUniversalReceiverEventSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseUniversalReceiverEventSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildUniversalReceiverEventSubscriptionConfig` in the node service layer.
 *
 * EVENT domain — defaults to block-order desc sort when no sort is provided.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildUniversalReceiverEventSubscriptionConfig — node service that builds the subscription config
 */
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

/**
 * Create a `useUniversalReceiverEventSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
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
