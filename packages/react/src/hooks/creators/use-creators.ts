import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys, fetchCreators, getClientUrl } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseCreatorsParams,
} from '@lsp-indexer/types';

/** Flat return shape for useCreators — creators array + totalCount + query state */
type UseCreatorsReturn<F> = { creators: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchCreatorsResult<F>, Error>,
  'data'
>;

/**
 * Fetch a paginated list of LSP4 creator records with filtering and sorting.
 *
 * Wraps `fetchCreators` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by creatorAddress, digitalAssetAddress, interfaceId, creatorName,
 * digitalAssetName, timestampFrom, timestampTo) and sorting (by timestamp,
 * creatorAddress, digitalAssetAddress, arrayIndex, creatorName, digitalAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 */
export function useCreators<const I extends CreatorInclude>(
  params: UseCreatorsParams & { include: I },
): UseCreatorsReturn<CreatorResult<I>>;
export function useCreators(
  params?: Omit<UseCreatorsParams, 'include'> & { include?: never },
): UseCreatorsReturn<Creator>;
export function useCreators(
  params: UseCreatorsParams & { include?: CreatorInclude },
): UseCreatorsReturn<PartialCreator>;
export function useCreators(
  params: UseCreatorsParams & { include?: CreatorInclude } = {},
): UseCreatorsReturn<PartialCreator> {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? fetchCreators(url, { filter, sort, limit, offset, include })
        : fetchCreators(url, { filter, sort, limit, offset }),
  });

  const creators = data?.creators ?? [];
  return { creators, totalCount: data?.totalCount ?? 0, ...rest };
}
