/**
 * Factory for useCreatorSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseCreatorSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildCreatorSubscriptionConfig` in the node service layer.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildCreatorSubscriptionConfig — node service that builds the subscription config
 */
import { buildCreatorSubscriptionConfig, creatorKeys } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseCreatorSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useCreatorSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseCreatorSubscription(useSubscription: UseSubscriptionFn) {
  function useCreatorSubscription<const I extends CreatorInclude>(
    params: UseCreatorSubscriptionParams & {
      include: I;
      onData?: (data: CreatorResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<CreatorResult<I>>;
  function useCreatorSubscription(
    params?: Omit<UseCreatorSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: Creator[]) => void;
    },
  ): UseSubscriptionReturn<Creator>;
  function useCreatorSubscription(
    params: UseCreatorSubscriptionParams & {
      include?: CreatorInclude;
      onData?: (data: PartialCreator[]) => void;
    },
  ): UseSubscriptionReturn<PartialCreator>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useCreatorSubscription(
    params: UseCreatorSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialCreator> {
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
    const config = buildCreatorSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [creatorKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useCreatorSubscription;
}
