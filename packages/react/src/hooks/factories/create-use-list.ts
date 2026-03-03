/**
 * Factory for paginated list hooks (useProfiles, useNfts, useFollows, etc.).
 *
 * Produces the runtime implementation that both `@lsp-indexer/react` and
 * `@lsp-indexer/next` share. Each package passes its own `queryFn`:
 * - React: `(params) => fetchProfiles(getClientUrl(), params)`
 * - Next:  `(params) => getProfiles(params)`
 *
 * The returned function has the widest signature. Each domain factory wraps
 * this with proper function overloads to preserve `const I` narrowing.
 *
 * @see createUseDetail — same pattern for single-entity hooks
 */
import { useQuery } from '@tanstack/react-query';

/**
 * Configuration for a paginated list hook factory.
 *
 * @typeParam TParams - The full params type (e.g., UseProfilesParams & { include?: ProfileInclude })
 * @typeParam TData   - The widest item type (e.g., PartialProfile)
 * @typeParam TResult - The full fetch result type (e.g., FetchProfilesResult<PartialProfile>)
 */
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
}

/**
 * The raw return shape from the factory — `{ items, totalCount, ...queryState }`.
 * Domain wrappers remap `items` to a named key (e.g., `profiles`, `nfts`).
 */
export type UseListRawReturn<TData, TResult extends { totalCount: number }> = {
  items: TData[];
  totalCount: number;
} & Omit<ReturnType<typeof useQuery<TResult, Error>>, 'data'>;

/**
 * Create a list hook implementation.
 *
 * @returns A function `(params) => { items, totalCount, ...queryRest }`
 *          that domain factories wrap with proper overloads.
 *
 * @example
 * ```ts
 * const useProfilesImpl = createUseList({
 *   queryKey: (p) => profileKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
 *   queryFn: (p) => p.include
 *     ? fetchProfiles(url, { ...p, include: p.include })
 *     : fetchProfiles(url, p),
 *   extractItems: (r) => r.profiles,
 * });
 * ```
 */
export function createUseList<
  TParams extends Record<string, unknown>,
  TData,
  TResult extends { totalCount: number },
>(config: CreateUseListConfig<TParams, TData, TResult>) {
  return function useListImpl(params: TParams): UseListRawReturn<TData, TResult> {
    const { data, ...rest } = useQuery<TResult, Error>({
      queryKey: config.queryKey(params),
      queryFn: () => config.queryFn(params),
    });

    const items = data ? config.extractItems(data) : [];
    return { items, totalCount: data?.totalCount ?? 0, ...rest };
  };
}
