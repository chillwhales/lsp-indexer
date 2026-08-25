import { buildV3SubscriptionConfig, v3Keys, type V3DomainListParams } from '@lsp-indexer/node';
import type {
  SubscriptionHookOptions,
  UseSubscriptionReturn,
  V3Domain,
  V3DomainResultMap,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { useOptionalIndexerClient } from '../../indexer';
import { useOptionalSubscriptionClient } from '../../subscriptions/context';
import { stableStringify } from '../../utils';
import { createUseSubscription } from '../factories/create-use-subscription';
import type { UseSubscriptionClient } from '../types';

export type UseV3SubscriptionOptions<Domain extends V3Domain> = SubscriptionHookOptions<
  V3DomainResultMap[Domain]
>;

function useV3SubscriptionClient(): UseSubscriptionClient {
  const indexerClient = useOptionalIndexerClient();
  const subscriptionClient = useOptionalSubscriptionClient();
  const client = indexerClient?.subscriptions ?? subscriptionClient;
  if (!client) {
    throw new Error(
      'useV3Subscription must be used within an <IndexerProvider> or ' +
        '<IndexerSubscriptionProvider>.',
    );
  }
  return client;
}

const useSubscriptionImpl = createUseSubscription(useV3SubscriptionClient);

/** Subscribe to any public v3 domain and optionally invalidate its network-scoped cache. */
export function useV3Subscription<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options: UseV3SubscriptionOptions<Domain> = {},
): UseSubscriptionReturn<V3DomainResultMap[Domain]> {
  const queryClient = useQueryClient();
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const stableParams = stableStringify(params);
  const config = useMemo(
    () => buildV3SubscriptionConfig(domain, paramsRef.current),
    [domain, stableParams],
  );

  return useSubscriptionImpl(config, {
    ...options,
    invalidateKeys:
      options.invalidateKeys ??
      (options.invalidate ? [v3Keys.domain(params.network, domain)] : undefined),
    queryClient: options.invalidate ? queryClient : undefined,
  });
}
