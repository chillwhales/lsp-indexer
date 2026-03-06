/** Generic factory for paginated list hooks (useProfiles, useNfts, useFollows, etc.). */
import { useQuery } from '@tanstack/react-query';

/** Configuration for a paginated list hook factory. */
export interface CreateUseListConfig<
  TParams extends Record<string, unknown>,
  TData,
  TResult extends { totalCount: number },
> {
  /** Build the TanStack Query cache key from params */
  queryKey: (params: TParams) => readonly unknown[];
  /** Fetch a paginated list. Called inside `queryFn`. */
  queryFn: (params: TParams) => Promise<TResult>;
  /**
   * Extract the items array from the fetch result.
   * (e.g., `(r) => r.profiles`, `(r) => r.nfts`)
   */
  extractItems: (result: TResult) => TData[];
  /** Derive the `enabled` flag from params (default: always enabled) */
  enabled?: (params: TParams) => boolean;
  /**
   * Time in ms that data is considered fresh. During this period, the query
   * will not refetch on mount or window focus. Defaults to TanStack Query's
   * global default (0 = always stale) when omitted.
   */
  staleTime?: number;
}

/**
 * The raw return shape from the factory — `{ items, totalCount, ...queryState }`.
 * Domain wrappers remap `items` to a named key (e.g., `profiles`, `nfts`).
 */
export type UseListRawReturn<TData, TResult extends { totalCount: number }> = {
  items: TData[];
  totalCount: number;
} & Omit<ReturnType<typeof useQuery<TResult, Error>>, 'data'>;

export function createUseList<
  TParams extends Record<string, unknown>,
  TData,
  TResult extends { totalCount: number },
>(config: CreateUseListConfig<TParams, TData, TResult>) {
  return function useListImpl(params: TParams): UseListRawReturn<TData, TResult> {
    const { data, ...rest } = useQuery<TResult, Error>({
      queryKey: config.queryKey(params),
      queryFn: () => config.queryFn(params),
      enabled: config.enabled ? config.enabled(params) : undefined,
      staleTime: config.staleTime,
    });

    const items = data ? config.extractItems(data) : [];
    return { items, totalCount: data?.totalCount ?? 0, ...rest };
  };
}
