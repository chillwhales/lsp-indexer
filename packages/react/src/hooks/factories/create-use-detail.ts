/**
 * Factory for single-entity detail hooks (useProfile, useDigitalAsset, useNft, etc.).
 *
 * Produces the runtime implementation that both `@lsp-indexer/react` and
 * `@lsp-indexer/next` share. Each package passes its own `fetchFn`:
 * - React: `(params) => fetchProfile(getClientUrl(), params)`
 * - Next:  `(params) => getProfile(params.address, params.include)`
 *
 * The returned function has the widest signature (accepts optional include,
 * returns the partial type). Each domain file casts this to an interface
 * with 3 overloaded call signatures to preserve `const I` narrowing.
 *
 * @see UseProfileHook (example domain interface with overloads)
 */
import { useQuery } from '@tanstack/react-query';

/**
 * Configuration for a single-entity detail hook factory.
 *
 * @typeParam TParams - The full params type (e.g., UseProfileParams & { include?: ProfileInclude })
 * @typeParam TData   - The widest return data type (e.g., PartialProfile)
 */
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

/**
 * Create a detail hook implementation.
 *
 * @returns A function `(params) => { data, ...queryRest }` that can be
 *          cast to a domain-specific overloaded interface.
 *
 * @example
 * ```ts
 * const useProfileImpl = createUseDetail({
 *   queryKey: (p) => profileKeys.detail(p.address, p.include),
 *   queryFn: (p) => p.include
 *     ? fetchProfile(url, { address: p.address, include: p.include })
 *     : fetchProfile(url, { address: p.address }),
 *   enabled: (p) => Boolean(p.address),
 * });
 * ```
 */
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
