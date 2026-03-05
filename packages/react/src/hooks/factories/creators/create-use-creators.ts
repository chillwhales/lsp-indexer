/**
 * Factory for useCreators — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseCreators(queryFn)` with its own fetch function:
 * - React: `(p) => fetchCreators(getClientUrl(), p)`
 * - Next:  `(p) => getCreators(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchCreatorsResult } from '@lsp-indexer/node';
import { creatorKeys } from '@lsp-indexer/node';
import type {
  Creator,
  CreatorInclude,
  CreatorResult,
  PartialCreator,
  UseCreatorsParams,
} from '@lsp-indexer/types';
import type { UseCreatorsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type CreatorsListParams = UseCreatorsParams & { include?: CreatorInclude };

/**
 * Create a `useCreators` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for creator lists
 */
export function createUseCreators(
  queryFn: (params: CreatorsListParams) => Promise<FetchCreatorsResult<PartialCreator>>,
) {
  const impl = createUseList<
    CreatorsListParams,
    PartialCreator,
    FetchCreatorsResult<PartialCreator>
  >({
    queryKey: (p) => creatorKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.creators,
  });

  function useCreators<const I extends CreatorInclude>(
    params: UseCreatorsParams & { include: I },
  ): UseCreatorsReturn<CreatorResult<I>>;
  function useCreators(
    params?: Omit<UseCreatorsParams, 'include'> & { include?: never },
  ): UseCreatorsReturn<Creator>;
  function useCreators(
    params: UseCreatorsParams & { include?: CreatorInclude },
  ): UseCreatorsReturn<PartialCreator>;
  function useCreators(
    params: UseCreatorsParams & { include?: CreatorInclude } = {},
  ): UseCreatorsReturn<PartialCreator> {
    const { items, ...rest } = impl(params);
    return { creators: items, ...rest };
  }

  return useCreators;
}
