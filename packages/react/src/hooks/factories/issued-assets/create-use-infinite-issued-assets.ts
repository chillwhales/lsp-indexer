/** @see createUseInfinite */
import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import { issuedAssetKeys } from '@lsp-indexer/node';
import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
  UseInfiniteIssuedAssetsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteIssuedAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type IssuedAssetsInfiniteParams = UseInfiniteIssuedAssetsParams & {
  include?: IssuedAssetInclude;
};

export function createUseInfiniteIssuedAssets(
  queryFn: (
    params: IssuedAssetsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>,
) {
  const impl = createUseInfinite<
    IssuedAssetsInfiniteParams,
    PartialIssuedAsset,
    FetchIssuedAssetsResult<PartialIssuedAsset>
  >({
    queryKey: (p) => issuedAssetKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.issuedAssets,
  });

  function useInfiniteIssuedAssets<const I extends IssuedAssetInclude>(
    params: UseInfiniteIssuedAssetsParams & { include: I },
  ): UseInfiniteIssuedAssetsReturn<IssuedAssetResult<I>>;
  function useInfiniteIssuedAssets(
    params?: Omit<UseInfiniteIssuedAssetsParams, 'include'> & { include?: never },
  ): UseInfiniteIssuedAssetsReturn<IssuedAsset>;
  function useInfiniteIssuedAssets(
    params: UseInfiniteIssuedAssetsParams & { include?: IssuedAssetInclude },
  ): UseInfiniteIssuedAssetsReturn<PartialIssuedAsset>;
  function useInfiniteIssuedAssets(
    params: UseInfiniteIssuedAssetsParams & { include?: IssuedAssetInclude } = {},
  ): UseInfiniteIssuedAssetsReturn<PartialIssuedAsset> {
    const { items, ...rest } = impl(params);
    return { issuedAssets: items, ...rest };
  }

  return useInfiniteIssuedAssets;
}
