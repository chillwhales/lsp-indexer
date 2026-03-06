/** @see createUseSubscription */
import { buildIssuedAssetSubscriptionConfig, issuedAssetKeys } from '@lsp-indexer/node';
import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseIssuedAssetSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseIssuedAssetSubscription(useSubscription: UseSubscriptionFn) {
  function useIssuedAssetSubscription<const I extends IssuedAssetInclude>(
    params: UseIssuedAssetSubscriptionParams & {
      include: I;
      onData?: (data: IssuedAssetResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<IssuedAssetResult<I>>;
  function useIssuedAssetSubscription(
    params?: Omit<UseIssuedAssetSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: IssuedAsset[]) => void;
    },
  ): UseSubscriptionReturn<IssuedAsset>;
  function useIssuedAssetSubscription(
    params: UseIssuedAssetSubscriptionParams & {
      include?: IssuedAssetInclude;
      onData?: (data: PartialIssuedAsset[]) => void;
    },
  ): UseSubscriptionReturn<PartialIssuedAsset>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useIssuedAssetSubscription(
    params: UseIssuedAssetSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialIssuedAsset> {
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
    const config = buildIssuedAssetSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [issuedAssetKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useIssuedAssetSubscription;
}
