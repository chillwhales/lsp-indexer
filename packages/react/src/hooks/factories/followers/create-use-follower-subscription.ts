/** @see createUseSubscription */
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
