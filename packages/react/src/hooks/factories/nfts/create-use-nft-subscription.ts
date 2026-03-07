/** @see createUseSubscription */
import { buildNftSubscriptionConfig, nftKeys } from '@lsp-indexer/node';
import type {
  Nft,
  NftInclude,
  NftResult,
  PartialNft,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseNftSubscriptionParams, UseSubscriptionFn } from '../../types';

export function createUseNftSubscription(useSubscription: UseSubscriptionFn) {
  function useNftSubscription<const I extends NftInclude>(
    params: UseNftSubscriptionParams & {
      include: I;
      onData?: (data: NftResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<NftResult<I>>;
  function useNftSubscription(
    params?: Omit<UseNftSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: Nft[]) => void;
    },
  ): UseSubscriptionReturn<Nft>;
  function useNftSubscription(
    params: UseNftSubscriptionParams & {
      include?: NftInclude;
      onData?: (data: PartialNft[]) => void;
    },
  ): UseSubscriptionReturn<PartialNft>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useNftSubscription(
    params: UseNftSubscriptionParams & { onData?: (data: any[]) => void } = {},
  ): UseSubscriptionReturn<PartialNft> {
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
    const config = buildNftSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [nftKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useNftSubscription;
}
