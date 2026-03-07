/** Generic factory for infinite scroll hooks (useInfiniteProfiles, useInfiniteNfts, etc.). */
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants';

/** Base params shape — individual domains extend with additional fields. */
interface InfiniteBaseParams {
  filter?: unknown;
  sort?: unknown;
  include?: unknown;
  pageSize?: number;
}

/** Configuration for an infinite scroll hook factory. */
export interface CreateUseInfiniteConfig<
  TParams extends InfiniteBaseParams,
  TData,
  TResult extends { totalCount: number },
> {
  /** Build the TanStack Query cache key from params (without pagination) */
  queryKey: (params: TParams) => readonly unknown[];
  /**
   * Fetch a page of items. Receives the domain params plus `limit` and `offset`
   * (injected by the factory from `pageSize` and `pageParam`).
   */
  queryFn: (params: TParams & { limit: number; offset: number }) => Promise<TResult>;
  /**
   * Extract the items array from a single page result.
   * (e.g., `(r) => r.profiles`, `(r) => r.nfts`)
   */
  extractItems: (result: TResult) => TData[];
  /** Default page size if not specified in params (default: 20) */
  defaultPageSize?: number;
  /** Derive the `enabled` flag from params (default: always enabled) */
  enabled?: (params: TParams) => boolean;
  /**
   * Time in ms that data is considered fresh. During this period, the query
   * will not refetch on mount or window focus. Defaults to TanStack Query's
   * global default (0 = always stale) when omitted.
   */
  staleTime?: number;
}

/** Raw return shape — domain wrappers remap `items` to a named key (e.g., `profiles`, `nfts`). */
export type UseInfiniteRawReturn<TData, TResult extends { totalCount: number }> = {
  items: TData[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<TResult>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/** Create an infinite scroll hook from the given config. */
export function createUseInfinite<
  TParams extends InfiniteBaseParams,
  TData,
  TResult extends { totalCount: number },
>(config: CreateUseInfiniteConfig<TParams, TData, TResult>) {
  const pageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  return function useInfiniteImpl(params: TParams) {
    const effectivePageSize = params.pageSize ?? pageSize;

    const result = useInfiniteQuery<
      TResult,
      Error,
      InfiniteData<TResult>,
      readonly unknown[],
      number
    >({
      queryKey: config.queryKey(params),
      queryFn: ({ pageParam }) =>
        config.queryFn({
          ...params,
          limit: effectivePageSize,
          offset: pageParam,
        }),
      initialPageParam: 0,
      enabled: config.enabled ? config.enabled(params) : undefined,
      staleTime: config.staleTime,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const items = config.extractItems(lastPage);
        if (items.length < effectivePageSize) {
          return undefined;
        }
        return lastPageParam + effectivePageSize;
      },
    });

    // Flatten all pages into a single items array (memoized)
    // Destructure infinite query properties before rest spread to avoid TS2783
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
    const items = useMemo(
      () => data?.pages.flatMap((page) => config.extractItems(page)) ?? [],
      [data?.pages],
    );

    return {
      items,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      ...rest,
    };
  };
}
