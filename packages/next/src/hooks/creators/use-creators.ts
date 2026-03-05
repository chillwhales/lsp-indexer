'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseCreatorsParams,
} from '@lsp-indexer/types';

import { getCreators } from '../../actions/creators';

/** Flat return shape for useCreators — creators array + totalCount + query state */
type UseCreatorsReturn<F> = { creators: F[]; totalCount: number } & Omit<
  UseQueryResult<FetchCreatorsResult<F>, Error>,
  'data'
>;

/**
 * Fetch a paginated list of LSP4 creator records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useCreators`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
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
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: creatorKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getCreators({ filter, sort, limit, offset, include })
        : getCreators({ filter, sort, limit, offset }),
  });

  const creators = data?.creators ?? [];
  return { creators, totalCount: data?.totalCount ?? 0, ...rest };
}
