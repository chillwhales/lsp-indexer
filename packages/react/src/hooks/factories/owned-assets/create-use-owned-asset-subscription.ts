/**
 * Factory for useOwnedAssetSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedAssetSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context).
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildOwnedAssetSubscriptionConfig` in the node service layer.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildOwnedAssetSubscriptionConfig — node service that builds the subscription config
 */
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

/**
 * Create a `useOwnedAssetSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 */
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
