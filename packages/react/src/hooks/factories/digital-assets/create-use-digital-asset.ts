/**
 * Factory for useDigitalAsset — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseDigitalAsset(queryFn)` with its own fetch function:
 * - React: `(p) => fetchDigitalAsset(getClientUrl(), p)`
 * - Next:  `(p) => getDigitalAsset(p.address, p.include)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
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

/** Params passed to the factory's queryFn — address + optional include */
type DigitalAssetDetailParams = UseDigitalAssetParams & { include?: DigitalAssetInclude };

/**
 * Create a `useDigitalAsset` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for a single digital asset
 */
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
