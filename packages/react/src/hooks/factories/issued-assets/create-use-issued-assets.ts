/** @see createUseList */
import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import { issuedAssetKeys } from '@lsp-indexer/node';
import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
  UseIssuedAssetsParams,
} from '@lsp-indexer/types';
import type { UseIssuedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type IssuedAssetsListParams = UseIssuedAssetsParams & { include?: IssuedAssetInclude };

export function createUseIssuedAssets(
  queryFn: (params: IssuedAssetsListParams) => Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>,
) {
  const impl = createUseList<
    IssuedAssetsListParams,
    PartialIssuedAsset,
    FetchIssuedAssetsResult<PartialIssuedAsset>
  >({
    queryKey: (p) => issuedAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.issuedAssets,
  });

  function useIssuedAssets<const I extends IssuedAssetInclude>(
    params: UseIssuedAssetsParams & { include: I },
  ): UseIssuedAssetsReturn<IssuedAssetResult<I>>;
  function useIssuedAssets(
    params?: Omit<UseIssuedAssetsParams, 'include'> & { include?: never },
  ): UseIssuedAssetsReturn<IssuedAsset>;
  function useIssuedAssets(
    params: UseIssuedAssetsParams & { include?: IssuedAssetInclude },
  ): UseIssuedAssetsReturn<PartialIssuedAsset>;
  function useIssuedAssets(
    params: UseIssuedAssetsParams & { include?: IssuedAssetInclude } = {},
  ): UseIssuedAssetsReturn<PartialIssuedAsset> {
    const { items, ...rest } = impl(params);
    return { issuedAssets: items, ...rest };
  }

  return useIssuedAssets;
}
