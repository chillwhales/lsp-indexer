/**
 * Factory for infinite scroll hooks (useInfiniteProfiles, useInfiniteNfts, etc.).
 *
 * Produces the runtime implementation that both `@lsp-indexer/react` and
 * `@lsp-indexer/next` share. Each package passes its own `queryFn`:
 * - React: `(params) => fetchProfiles(getClientUrl(), params)`
 * - Next:  `(params) => getProfiles(params)`
 *
 * The returned function has the widest signature. Each domain factory wraps
 * this with proper function overloads to preserve `const I` narrowing.
 *
 * @see createUseList — same pattern for paginated (non-infinite) list hooks
 */
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../constants';

/**
 * Params shape for infinite hooks. All infinite hooks accept these fields,
 * though individual domains may extend with additional fields.
 */
interface InfiniteBaseParams {
  filter?: unknown;
  sort?: unknown;
  include?: unknown;
  pageSize?: number;
}

/**
 * Configuration for an infinite scroll hook factory.
 *
 * @typeParam TParams - The full params type (e.g., UseInfiniteProfilesParams & { include?: ProfileInclude })
 * @typeParam TData   - The widest item type (e.g., PartialProfile)
 * @typeParam TResult - The full fetch result type (e.g., FetchProfilesResult<PartialProfile>)
 */
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
}

/**
 * The raw return shape from the factory — `{ items, hasNextPage, ... }`.
 * Domain wrappers remap `items` to a named key (e.g., `profiles`, `nfts`).
 *
 * Uses `Omit` over `UseInfiniteQueryResult` to preserve all TanStack Query
 * fields with precise types, matching the pattern in `UseListRawReturn`.
 */
export type UseInfiniteRawReturn<TData, TResult extends { totalCount: number }> = {
  items: TData[];
  hasNextPage: boolean;
  fetchNextPage: UseInfiniteQueryResult['fetchNextPage'];
  isFetchingNextPage: boolean;
} & Omit<
  UseInfiniteQueryResult<InfiniteData<TResult>, Error>,
  'data' | 'hasNextPage' | 'fetchNextPage' | 'isFetchingNextPage'
>;

/**
 * Create an infinite scroll hook implementation.
 *
 * @returns A function `(params) => { items, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }`
 *          that domain factories wrap with proper overloads.
 *
 * @example
 * ```ts
 * const useInfiniteProfilesImpl = createUseInfinite({
 *   queryKey: (p) => profileKeys.infinite(p.filter, p.sort, p.include),
 *   queryFn: (p) => p.include
 *     ? fetchProfiles(url, { filter: p.filter, sort: p.sort, limit: p.limit, offset: p.offset, include: p.include })
 *     : fetchProfiles(url, { filter: p.filter, sort: p.sort, limit: p.limit, offset: p.offset }),
 *   extractItems: (r) => r.profiles,
 * });
 * ```
 */
export function createUseInfinite<
  TParams extends InfiniteBaseParams,
  TData,
  TResult extends { totalCount: number },
>(config: CreateUseInfiniteConfig<TParams, TData, TResult>) {
  const pageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  return function useInfiniteImpl(params: TParams) {
    const effectivePageSize = params.pageSize ?? pageSize;

    const result = useInfiniteQuery<TResult, Error, InfiniteData<TResult>>({
      queryKey: config.queryKey(params),
      queryFn: ({ pageParam }) =>
        config.queryFn({
          ...params,
          limit: effectivePageSize,
          offset: pageParam as number,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const items = config.extractItems(lastPage);
        if (items.length < effectivePageSize) {
          return undefined;
        }
        return (lastPageParam as number) + effectivePageSize;
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
