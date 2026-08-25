import { fetchV3Domain, getClientUrl, type V3DomainListParams } from '@lsp-indexer/node';
import type { V3Domain, V3DomainResultMap, V3ListResult } from '@lsp-indexer/types';
import { useMemo } from 'react';
import { useOptionalIndexerClient } from '../../indexer';
import {
  createUseV3Infinite,
  createUseV3List,
  type UseV3InfiniteReturn,
  type UseV3ListReturn,
  type V3DomainQuery,
  type V3InfiniteParams,
  type V3QueryHookOptions,
} from '../factories/v3';

function useBrowserV3Query(): V3DomainQuery {
  const providerUrl = useOptionalIndexerClient()?.url;

  return useMemo(() => {
    function query<Domain extends V3Domain>(
      domain: Domain,
      params: V3DomainListParams<Domain>,
    ): Promise<V3ListResult<V3DomainResultMap[Domain]>> {
      return fetchV3Domain(providerUrl ?? getClientUrl(), domain, params);
    }
    return query;
  }, [providerUrl]);
}

const useV3ListImpl = createUseV3List(useBrowserV3Query);
const useV3InfiniteImpl = createUseV3Infinite(useBrowserV3Query);

/** Query any public v3 domain through the browser HTTP transport. */
export function useV3List<Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3ListReturn<Domain> {
  return useV3ListImpl(domain, params, options);
}

/** Infinitely page any public v3 domain through the browser HTTP transport. */
export function useV3Infinite<Domain extends V3Domain>(
  domain: Domain,
  params: V3InfiniteParams<Domain>,
  options?: V3QueryHookOptions,
): UseV3InfiniteReturn<Domain> {
  return useV3InfiniteImpl(domain, params, options);
}
