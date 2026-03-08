/** @see createUseSubscription */
import { buildEncryptedAssetSubscriptionConfig, encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  EncryptedAsset,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseEncryptedAssetSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseEncryptedAssetSubscription(useSubscription: UseSubscriptionFn) {
  function useEncryptedAssetSubscription<const I extends EncryptedAssetInclude>(
    params: UseEncryptedAssetSubscriptionParams & {
      include: I;
      onData?: (data: EncryptedAssetResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<EncryptedAssetResult<I>>;
  function useEncryptedAssetSubscription(
    params?: Omit<UseEncryptedAssetSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: EncryptedAsset[]) => void;
    },
  ): UseSubscriptionReturn<EncryptedAsset>;
  function useEncryptedAssetSubscription(
    params: UseEncryptedAssetSubscriptionParams & {
      include?: EncryptedAssetInclude;
      onData?: (data: PartialEncryptedAsset[]) => void;
    },
  ): UseSubscriptionReturn<PartialEncryptedAsset>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useEncryptedAssetSubscription(
    params: UseEncryptedAssetSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialEncryptedAsset> {
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
    const config = buildEncryptedAssetSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [encryptedAssetKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useEncryptedAssetSubscription;
}
