/**
 * Factory for useOwnedTokenSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedTokenSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildOwnedTokenSubscriptionConfig` in the node service layer.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildOwnedTokenSubscriptionConfig — node service that builds the subscription config
 */
import { buildOwnedTokenSubscriptionConfig, ownedTokenKeys } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseOwnedTokenSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useOwnedTokenSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseOwnedTokenSubscription(useSubscription: UseSubscriptionFn) {
  function useOwnedTokenSubscription<const I extends OwnedTokenInclude>(
    params: UseOwnedTokenSubscriptionParams & {
      include: I;
      onData?: (data: OwnedTokenResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<OwnedTokenResult<I>>;
  function useOwnedTokenSubscription(
    params?: Omit<UseOwnedTokenSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: OwnedToken[]) => void;
    },
  ): UseSubscriptionReturn<OwnedToken>;
  function useOwnedTokenSubscription(
    params: UseOwnedTokenSubscriptionParams & {
      include?: OwnedTokenInclude;
      onData?: (data: PartialOwnedToken[]) => void;
    },
  ): UseSubscriptionReturn<PartialOwnedToken>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useOwnedTokenSubscription(
    params: UseOwnedTokenSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialOwnedToken> {
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
    const config = buildOwnedTokenSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [ownedTokenKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useOwnedTokenSubscription;
}
