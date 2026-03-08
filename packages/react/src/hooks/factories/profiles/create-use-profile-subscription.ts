/** @see createUseSubscription */
import { buildProfileSubscriptionConfig, profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseProfileSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseProfileSubscription(useSubscription: UseSubscriptionFn) {
  function useProfileSubscription<const I extends ProfileInclude>(
    params: UseProfileSubscriptionParams & {
      include: I;
      onData?: (data: ProfileResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<ProfileResult<I>>;
  function useProfileSubscription(
    params?: Omit<UseProfileSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: Profile[]) => void;
    },
  ): UseSubscriptionReturn<Profile>;
  function useProfileSubscription(
    params: UseProfileSubscriptionParams & {
      include?: ProfileInclude;
      onData?: (data: PartialProfile[]) => void;
    },
  ): UseSubscriptionReturn<PartialProfile>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useProfileSubscription(
    params: UseProfileSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialProfile> {
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
    const config = buildProfileSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [profileKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useProfileSubscription;
}
