/**
 * Factory for useInfiniteCreators — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteCreators(queryFn)` with its own fetch:
 * - React: `(p) => fetchCreators(getClientUrl(), p)`
 * - Next:  `(p) => getCreators(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseInfiniteCreatorsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteCreatorsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteCreatorsParams with optional include */
type CreatorsInfiniteParams = UseInfiniteCreatorsParams & {
  include?: CreatorInclude;
};

/**
 * Create a `useInfiniteCreators` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for creator lists (with limit + offset)
 */
export function createUseInfiniteCreators(
  queryFn: (
    params: CreatorsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchCreatorsResult<PartialCreator>>,
) {
  const impl = createUseInfinite<
    CreatorsInfiniteParams,
    PartialCreator,
    FetchCreatorsResult<PartialCreator>
  >({
    queryKey: (p) => creatorKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.creators,
  });

  function useInfiniteCreators<const I extends CreatorInclude>(
    params: UseInfiniteCreatorsParams & { include: I },
  ): UseInfiniteCreatorsReturn<CreatorResult<I>>;
  function useInfiniteCreators(
    params?: Omit<UseInfiniteCreatorsParams, 'include'> & { include?: never },
  ): UseInfiniteCreatorsReturn<Creator>;
  function useInfiniteCreators(
    params: UseInfiniteCreatorsParams & { include?: CreatorInclude },
  ): UseInfiniteCreatorsReturn<PartialCreator>;
  function useInfiniteCreators(
    params: UseInfiniteCreatorsParams & { include?: CreatorInclude } = {},
  ): UseInfiniteCreatorsReturn<PartialCreator> {
    const { items, ...rest } = impl(params);
    return { creators: items, ...rest };
  }

  return useInfiniteCreators;
}
