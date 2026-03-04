/**
 * Factory for useFollowerSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseFollowerSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildFollowerSubscriptionConfig` in the node service layer.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildFollowerSubscriptionConfig — node service that builds the subscription config
 */
import { buildFollowerSubscriptionConfig, followerKeys } from '@lsp-indexer/node';
import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import type { UseFollowerSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useFollowerSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseFollowerSubscription(useSubscription: UseSubscriptionFn) {
  function useFollowerSubscription<const I extends FollowerInclude>(
    params: UseFollowerSubscriptionParams & {
      include: I;
      onData?: (data: FollowerResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<FollowerResult<I>>;
  function useFollowerSubscription(
    params?: Omit<UseFollowerSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: Follower[]) => void;
    },
  ): UseSubscriptionReturn<Follower>;
  function useFollowerSubscription(
    params: UseFollowerSubscriptionParams & {
      include?: FollowerInclude;
      onData?: (data: PartialFollower[]) => void;
    },
  ): UseSubscriptionReturn<PartialFollower>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useFollowerSubscription(
    params: UseFollowerSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialFollower> {
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
    const config = buildFollowerSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [followerKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useFollowerSubscription;
}
