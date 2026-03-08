/** @see createUseList */
import { type FetchEncryptedAssetsResult, encryptedAssetKeys } from '@lsp-indexer/node';
import {
  type EncryptedAsset,
  type EncryptedAssetInclude,
  type EncryptedAssetResult,
  type PartialEncryptedAsset,
  type UseEncryptedAssetsParams,
} from '@lsp-indexer/types';
import { type UseEncryptedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type EncryptedAssetsListParams = UseEncryptedAssetsParams & { include?: EncryptedAssetInclude };

export function createUseEncryptedAssets(
  queryFn: (
    params: EncryptedAssetsListParams,
  ) => Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>>,
) {
  const impl = createUseList<
    EncryptedAssetsListParams,
    PartialEncryptedAsset,
    FetchEncryptedAssetsResult<PartialEncryptedAsset>
  >({
    queryKey: (p) => encryptedAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.encryptedAssets,
  });

  function useEncryptedAssets<const I extends EncryptedAssetInclude>(
    params: UseEncryptedAssetsParams & { include: I },
  ): UseEncryptedAssetsReturn<EncryptedAssetResult<I>>;
  function useEncryptedAssets(
    params?: Omit<UseEncryptedAssetsParams, 'include'> & { include?: never },
  ): UseEncryptedAssetsReturn<EncryptedAsset>;
  function useEncryptedAssets(
    params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude },
  ): UseEncryptedAssetsReturn<PartialEncryptedAsset>;
  function useEncryptedAssets(
    params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude } = {},
  ): UseEncryptedAssetsReturn<PartialEncryptedAsset> {
    const { items, ...rest } = impl(params);
    return { encryptedAssets: items, ...rest };
  }

  return useEncryptedAssets;
}
