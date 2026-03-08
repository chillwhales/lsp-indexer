/** @see createUseInfinite */
import { type FetchOwnedAssetsResult, ownedAssetKeys } from '@lsp-indexer/node';
import {
  type OwnedAsset,
  type OwnedAssetInclude,
  type OwnedAssetResult,
  type PartialOwnedAsset,
  type UseInfiniteOwnedAssetsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteOwnedAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type OwnedAssetInfiniteParams = UseInfiniteOwnedAssetsParams & {
  include?: OwnedAssetInclude;
};

export function createUseInfiniteOwnedAssets(
  queryFn: (
    params: OwnedAssetInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchOwnedAssetsResult<PartialOwnedAsset>>,
) {
  const impl = createUseInfinite<
    OwnedAssetInfiniteParams,
    PartialOwnedAsset,
    FetchOwnedAssetsResult<PartialOwnedAsset>
  >({
    queryKey: (p) => ownedAssetKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.ownedAssets,
  });

  function useInfiniteOwnedAssets<const I extends OwnedAssetInclude>(
    params: UseInfiniteOwnedAssetsParams & { include: I },
  ): UseInfiniteOwnedAssetsReturn<OwnedAssetResult<I>>;
  function useInfiniteOwnedAssets(
    params?: Omit<UseInfiniteOwnedAssetsParams, 'include'> & { include?: never },
  ): UseInfiniteOwnedAssetsReturn<OwnedAsset>;
  function useInfiniteOwnedAssets(
    params: UseInfiniteOwnedAssetsParams & { include?: OwnedAssetInclude },
  ): UseInfiniteOwnedAssetsReturn<PartialOwnedAsset>;
  function useInfiniteOwnedAssets(
    params: UseInfiniteOwnedAssetsParams & { include?: OwnedAssetInclude } = {},
  ): UseInfiniteOwnedAssetsReturn<PartialOwnedAsset> {
    const { items, ...rest } = impl(params);
    return { ownedAssets: items, ...rest };
  }

  return useInfiniteOwnedAssets;
}
