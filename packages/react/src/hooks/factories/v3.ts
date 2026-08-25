import { v3Keys, type V3DomainListParams } from '@lsp-indexer/node';
import type { V3Domain, V3DomainResultMap, V3ListResult } from '@lsp-indexer/types';
import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants';

export interface V3QueryHookOptions {
  enabled?: boolean;
  staleTime?: number;
}

export type V3DomainQuery = <Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
) => Promise<V3ListResult<V3DomainResultMap[Domain]>>;

export type UseV3ListReturn<Domain extends V3Domain> = {
  items: V3DomainResultMap[Domain][];
  totalCount: number;
} & Omit<UseQueryResult<V3ListResult<V3DomainResultMap[Domain]>, Error>, 'data'>;

export type V3InfiniteParams<Domain extends V3Domain> = Omit<
  V3DomainListParams<Domain>,
  'limit' | 'offset'
> & {
  pageSize?: number;
};

export type UseV3InfiniteReturn<Domain extends V3Domain> = {
  items: V3DomainResultMap[Domain][];
  totalCount: number;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<V3ListResult<V3DomainResultMap[Domain]>, number>, Error>,
  'data'
>;

export type UseV3ListHook = <Domain extends V3Domain>(
  domain: Domain,
  params: V3DomainListParams<Domain>,
  options?: V3QueryHookOptions,
) => UseV3ListReturn<Domain>;

export type UseV3InfiniteHook = <Domain extends V3Domain>(
  domain: Domain,
  params: V3InfiniteParams<Domain>,
  options?: V3QueryHookOptions,
) => UseV3InfiniteReturn<Domain>;

/** Return the next offset, using the server count to avoid an unnecessary terminal request. */
export function getV3NextPageOffset<T>(
  lastPage: V3ListResult<T>,
  allPages: V3ListResult<T>[],
  lastPageOffset: number,
): number | undefined {
  const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0);
  if (lastPage.items.length === 0 || loadedCount >= lastPage.totalCount) return undefined;
  return lastPageOffset + lastPage.items.length;
}

/** Create a typed uniform v3 list hook for a framework-specific query transport. */
export function createUseV3List(useDomainQuery: () => V3DomainQuery): UseV3ListHook {
  return function useV3List<Domain extends V3Domain>(
    domain: Domain,
    params: V3DomainListParams<Domain>,
    options: V3QueryHookOptions = {},
  ): UseV3ListReturn<Domain> {
    const query = useDomainQuery();
    const { data, ...queryState } = useQuery<V3ListResult<V3DomainResultMap[Domain]>, Error>({
      queryKey: v3Keys.list(domain, params),
      queryFn: () => query(domain, params),
      enabled: options.enabled,
      staleTime: options.staleTime,
    });

    return {
      items: data?.items ?? [],
      totalCount: data?.totalCount ?? 0,
      ...queryState,
    };
  };
}

/** Create a typed uniform v3 infinite hook for a framework-specific query transport. */
export function createUseV3Infinite(useDomainQuery: () => V3DomainQuery): UseV3InfiniteHook {
  return function useV3Infinite<Domain extends V3Domain>(
    domain: Domain,
    params: V3InfiniteParams<Domain>,
    options: V3QueryHookOptions = {},
  ): UseV3InfiniteReturn<Domain> {
    const query = useDomainQuery();
    const { pageSize = DEFAULT_PAGE_SIZE, ...listParams } = params;
    const { data, ...queryState } = useInfiniteQuery<
      V3ListResult<V3DomainResultMap[Domain]>,
      Error,
      InfiniteData<V3ListResult<V3DomainResultMap[Domain]>, number>,
      readonly unknown[],
      number
    >({
      queryKey: v3Keys.infinite(domain, params),
      queryFn: ({ pageParam }) =>
        query(domain, {
          ...listParams,
          limit: pageSize,
          offset: pageParam,
        }),
      initialPageParam: 0,
      enabled: options.enabled,
      staleTime: options.staleTime,
      getNextPageParam: getV3NextPageOffset,
    });

    const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data?.pages]);

    return {
      items,
      totalCount: data?.pages[0]?.totalCount ?? 0,
      ...queryState,
    };
  };
}
