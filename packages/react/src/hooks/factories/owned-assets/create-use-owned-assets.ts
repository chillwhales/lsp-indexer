/** @see createUseList */
import { type FetchOwnedAssetsResult, ownedAssetKeys } from '@lsp-indexer/node';
import {
  type OwnedAsset,
  type OwnedAssetInclude,
  type OwnedAssetResult,
  type PartialOwnedAsset,
  type UseOwnedAssetsParams,
} from '@lsp-indexer/types';
import { type UseOwnedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type OwnedAssetListParams = UseOwnedAssetsParams & { include?: OwnedAssetInclude };

export function createUseOwnedAssets(
  queryFn: (params: OwnedAssetListParams) => Promise<FetchOwnedAssetsResult<PartialOwnedAsset>>,
) {
  const impl = createUseList<
    OwnedAssetListParams,
    PartialOwnedAsset,
    FetchOwnedAssetsResult<PartialOwnedAsset>
  >({
    queryKey: (p) => ownedAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.ownedAssets,
  });

  function useOwnedAssets<const I extends OwnedAssetInclude>(
    params: UseOwnedAssetsParams & { include: I },
  ): UseOwnedAssetsReturn<OwnedAssetResult<I>>;
  function useOwnedAssets(
    params?: Omit<UseOwnedAssetsParams, 'include'> & { include?: never },
  ): UseOwnedAssetsReturn<OwnedAsset>;
  function useOwnedAssets(
    params: UseOwnedAssetsParams & { include?: OwnedAssetInclude },
  ): UseOwnedAssetsReturn<PartialOwnedAsset>;
  function useOwnedAssets(
    params: UseOwnedAssetsParams & { include?: OwnedAssetInclude } = {},
  ): UseOwnedAssetsReturn<PartialOwnedAsset> {
    const { items, ...rest } = impl(params);
    return { ownedAssets: items, ...rest };
  }

  return useOwnedAssets;
}
