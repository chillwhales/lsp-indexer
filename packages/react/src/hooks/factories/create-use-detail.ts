/** Generic factory for single-entity detail hooks (useProfile, useDigitalAsset, useNft, etc.). */
import { useQuery } from '@tanstack/react-query';

/** Configuration for a single-entity detail hook factory. */
export interface CreateUseDetailConfig<TParams extends Record<string, unknown>, TData> {
  /** Build the TanStack Query cache key from params */
  queryKey: (params: TParams) => readonly unknown[];
  /**
   * Fetch a single entity. Called inside `queryFn`.
   * Both the include and non-include branches are the caller's responsibility —
   * the factory passes `params` straight through.
   */
  queryFn: (params: TParams) => Promise<TData | null>;
  /** Derive the `enabled` flag from params (e.g., `Boolean(p.address)`) */
  enabled: (params: TParams) => boolean;
  /**
   * Time in ms that data is considered fresh. During this period, the query
   * will not refetch on mount or window focus. Defaults to TanStack Query's
   * global default (0 = always stale) when omitted.
   */
  staleTime?: number;
}

/**
 * The raw return shape from the factory — `{ data, ...queryState }`.
 * Domain wrappers destructure this and remap `data` to a named key
 * (e.g., `profile`, `nft`).
 */
export type UseDetailRawReturn<TData> = {
  data: TData | null;
} & Omit<ReturnType<typeof useQuery<TData | null, Error>>, 'data'>;

export function createUseDetail<TParams extends Record<string, unknown>, TData>(
  config: CreateUseDetailConfig<TParams, TData>,
) {
  return function useDetailImpl(params: TParams): UseDetailRawReturn<TData> {
    const { data: rawData, ...rest } = useQuery<TData | null, Error>({
      queryKey: config.queryKey(params),
      queryFn: () => config.queryFn(params),
      enabled: config.enabled(params),
      staleTime: config.staleTime,
    });

    return { data: rawData ?? null, ...rest };
  };
}
