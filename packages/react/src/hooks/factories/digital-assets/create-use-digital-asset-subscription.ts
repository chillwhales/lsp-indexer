/**
 * Factory for useDigitalAssetSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseDigitalAssetSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildDigitalAssetSubscriptionConfig` in the node service layer.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildDigitalAssetSubscriptionConfig — node service that builds the subscription config
 */
import { buildDigitalAssetSubscriptionConfig, digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseDigitalAssetSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useDigitalAssetSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
export function createUseDigitalAssetSubscription(useSubscription: UseSubscriptionFn) {
  function useDigitalAssetSubscription<const I extends DigitalAssetInclude>(
    params: UseDigitalAssetSubscriptionParams & {
      include: I;
      onData?: (data: DigitalAssetResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<DigitalAssetResult<I>>;
  function useDigitalAssetSubscription(
    params?: Omit<UseDigitalAssetSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: DigitalAsset[]) => void;
    },
  ): UseSubscriptionReturn<DigitalAsset>;
  function useDigitalAssetSubscription(
    params: UseDigitalAssetSubscriptionParams & {
      include?: DigitalAssetInclude;
      onData?: (data: PartialDigitalAsset[]) => void;
    },
  ): UseSubscriptionReturn<PartialDigitalAsset>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useDigitalAssetSubscription(
    params: UseDigitalAssetSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialDigitalAsset> {
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
    const config = buildDigitalAssetSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [digitalAssetKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useDigitalAssetSubscription;
}
