/**
 * Factory for useTokenIdDataChangedEventSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseTokenIdDataChangedEventSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildTokenIdDataChangedEventSubscriptionConfig` in the node service layer.
 *
 * EVENT domain — defaults to block-order desc sort when no sort is provided.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildTokenIdDataChangedEventSubscriptionConfig — node service that builds the subscription config
 */
import {
  buildTokenIdDataChangedEventSubscriptionConfig,
  tokenIdDataChangedEventKeys,
} from '@lsp-indexer/node';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import type { UseSubscriptionFn, UseTokenIdDataChangedEventSubscriptionParams } from '../../types';

/**
 * Create a `useTokenIdDataChangedEventSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseTokenIdDataChangedEventSubscription(useSubscription: UseSubscriptionFn) {
  function useTokenIdDataChangedEventSubscription<const I extends TokenIdDataChangedEventInclude>(
    params: UseTokenIdDataChangedEventSubscriptionParams & {
      include: I;
      onData?: (data: TokenIdDataChangedEventResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<TokenIdDataChangedEventResult<I>>;
  function useTokenIdDataChangedEventSubscription(
    params?: Omit<UseTokenIdDataChangedEventSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: TokenIdDataChangedEvent[]) => void;
    },
  ): UseSubscriptionReturn<TokenIdDataChangedEvent>;
  function useTokenIdDataChangedEventSubscription(
    params: UseTokenIdDataChangedEventSubscriptionParams & {
      include?: TokenIdDataChangedEventInclude;
      onData?: (data: PartialTokenIdDataChangedEvent[]) => void;
    },
  ): UseSubscriptionReturn<PartialTokenIdDataChangedEvent>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useTokenIdDataChangedEventSubscription(
    params: UseTokenIdDataChangedEventSubscriptionParams & {
      onData?: (data: any[]) => void;
    } = {},
  ): UseSubscriptionReturn<PartialTokenIdDataChangedEvent> {
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
    const config = buildTokenIdDataChangedEventSubscriptionConfig({
      filter,
      sort,
      limit,
      include,
    });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [tokenIdDataChangedEventKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useTokenIdDataChangedEventSubscription;
}
