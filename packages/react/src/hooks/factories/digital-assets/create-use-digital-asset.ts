/** @see createUseDetail */
import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseDigitalAssetParams,
} from '@lsp-indexer/types';
import type { UseDigitalAssetReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type DigitalAssetDetailParams = UseDigitalAssetParams & { include?: DigitalAssetInclude };

export function createUseDigitalAsset(
  queryFn: (params: DigitalAssetDetailParams) => Promise<PartialDigitalAsset | null>,
) {
  const impl = createUseDetail<DigitalAssetDetailParams, PartialDigitalAsset>({
    queryKey: (p) => digitalAssetKeys.detail(p.address, p.include),
    queryFn,
    enabled: (p) => Boolean(p.address),
  });

  function useDigitalAsset<const I extends DigitalAssetInclude>(
    params: UseDigitalAssetParams & { include: I },
  ): UseDigitalAssetReturn<DigitalAssetResult<I>>;
  function useDigitalAsset(
    params: Omit<UseDigitalAssetParams, 'include'> & { include?: never },
  ): UseDigitalAssetReturn<DigitalAsset>;
  function useDigitalAsset(
    params: UseDigitalAssetParams & { include?: DigitalAssetInclude },
  ): UseDigitalAssetReturn<PartialDigitalAsset>;
  function useDigitalAsset(
    params: UseDigitalAssetParams & { include?: DigitalAssetInclude },
  ): UseDigitalAssetReturn<PartialDigitalAsset> {
    const { data, ...rest } = impl(params);
    return { digitalAsset: data, ...rest };
  }

  return useDigitalAsset;
}
