/** @see createUseSubscription */
import { buildOwnedAssetSubscriptionConfig, ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseOwnedAssetSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseOwnedAssetSubscription(useSubscription: UseSubscriptionFn) {
  function useOwnedAssetSubscription<const I extends OwnedAssetInclude>(
    params: UseOwnedAssetSubscriptionParams & {
      include: I;
      onData?: (data: OwnedAssetResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<OwnedAssetResult<I>>;
  function useOwnedAssetSubscription(
    params?: Omit<UseOwnedAssetSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: OwnedAsset[]) => void;
    },
  ): UseSubscriptionReturn<OwnedAsset>;
  function useOwnedAssetSubscription(
    params: UseOwnedAssetSubscriptionParams & {
      include?: OwnedAssetInclude;
      onData?: (data: PartialOwnedAsset[]) => void;
    },
  ): UseSubscriptionReturn<PartialOwnedAsset>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useOwnedAssetSubscription(
    params: UseOwnedAssetSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialOwnedAsset> {
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
    const config = buildOwnedAssetSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [ownedAssetKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useOwnedAssetSubscription;
}
