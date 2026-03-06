/** @see createUseList */
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

type CreatorsListParams = UseCreatorsParams & { include?: CreatorInclude };

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
