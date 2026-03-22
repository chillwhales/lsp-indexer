import { type FetchEncryptedAssetsBatchResult, encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  EncryptedAsset,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
  UseEncryptedAssetsBatchParams,
} from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseEncryptedAssetsBatchReturn } from '../../types';

type BatchQueryParams = UseEncryptedAssetsBatchParams & { include?: EncryptedAssetInclude };

export function createUseEncryptedAssetsBatch(
  queryFn: (
    params: BatchQueryParams,
  ) => Promise<FetchEncryptedAssetsBatchResult<PartialEncryptedAsset>>,
) {
  function useEncryptedAssetsBatch<const I extends EncryptedAssetInclude>(
    params: UseEncryptedAssetsBatchParams & { include: I },
  ): UseEncryptedAssetsBatchReturn<EncryptedAssetResult<I>>;
  function useEncryptedAssetsBatch(
    params: Omit<UseEncryptedAssetsBatchParams, 'include'> & { include?: never },
  ): UseEncryptedAssetsBatchReturn<EncryptedAsset>;
  function useEncryptedAssetsBatch(
    params: UseEncryptedAssetsBatchParams & { include?: EncryptedAssetInclude },
  ): UseEncryptedAssetsBatchReturn<PartialEncryptedAsset>;
  function useEncryptedAssetsBatch(
    params: UseEncryptedAssetsBatchParams & { include?: EncryptedAssetInclude },
  ): UseEncryptedAssetsBatchReturn<PartialEncryptedAsset> {
    const { tuples, include } = params;

    const { data, ...rest } = useQuery({
      queryKey: encryptedAssetKeys.batch(tuples, include),
      queryFn: () => queryFn(params),
      enabled: tuples.length > 0,
    });

    return {
      encryptedAssets: data?.encryptedAssets ?? [],
      ...rest,
    };
  }

  return useEncryptedAssetsBatch;
}
