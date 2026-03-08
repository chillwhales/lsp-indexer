/** @see createUseDetail */
import { ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseOwnedAssetParams,
} from '@lsp-indexer/types';
import type { UseOwnedAssetReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type OwnedAssetDetailParams = UseOwnedAssetParams & { include?: OwnedAssetInclude };

export function createUseOwnedAsset(
  queryFn: (params: OwnedAssetDetailParams) => Promise<PartialOwnedAsset | null>,
) {
  const impl = createUseDetail<OwnedAssetDetailParams, PartialOwnedAsset>({
    queryKey: (p) => ownedAssetKeys.detail(p.id, p.include),
    queryFn,
    enabled: (p) => Boolean(p.id),
  });

  function useOwnedAsset<const I extends OwnedAssetInclude>(
    params: UseOwnedAssetParams & { include: I },
  ): UseOwnedAssetReturn<OwnedAssetResult<I>>;
  function useOwnedAsset(
    params: Omit<UseOwnedAssetParams, 'include'> & { include?: never },
  ): UseOwnedAssetReturn<OwnedAsset>;
  function useOwnedAsset(
    params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
  ): UseOwnedAssetReturn<PartialOwnedAsset>;
  function useOwnedAsset(
    params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
  ): UseOwnedAssetReturn<PartialOwnedAsset> {
    const { data, ...rest } = impl(params);
    return { ownedAsset: data, ...rest };
  }

  return useOwnedAsset;
}
