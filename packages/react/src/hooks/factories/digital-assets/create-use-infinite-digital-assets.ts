/** @see createUseInfinite */
import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteDigitalAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type DigitalAssetInfiniteParams = UseInfiniteDigitalAssetsParams & {
  include?: DigitalAssetInclude;
};

export function createUseInfiniteDigitalAssets(
  queryFn: (
    params: DigitalAssetInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>,
) {
  const impl = createUseInfinite<
    DigitalAssetInfiniteParams,
    PartialDigitalAsset,
    FetchDigitalAssetsResult<PartialDigitalAsset>
  >({
    queryKey: (p) => digitalAssetKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.digitalAssets,
  });

  function useInfiniteDigitalAssets<const I extends DigitalAssetInclude>(
    params: UseInfiniteDigitalAssetsParams & { include: I },
  ): UseInfiniteDigitalAssetsReturn<DigitalAssetResult<I>>;
  function useInfiniteDigitalAssets(
    params?: Omit<UseInfiniteDigitalAssetsParams, 'include'> & { include?: never },
  ): UseInfiniteDigitalAssetsReturn<DigitalAsset>;
  function useInfiniteDigitalAssets(
    params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude },
  ): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset>;
  function useInfiniteDigitalAssets(
    params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude } = {},
  ): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset> {
    const { items, ...rest } = impl(params);
    return { digitalAssets: items, ...rest };
  }

  return useInfiniteDigitalAssets;
}
