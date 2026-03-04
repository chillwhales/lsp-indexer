/**
 * Factory for useDigitalAssets — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseDigitalAssets(queryFn)` with its own fetch function:
 * - React: `(p) => fetchDigitalAssets(getClientUrl(), p)`
 * - Next:  `(p) => getDigitalAssets(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseDigitalAssetsParams,
} from '@lsp-indexer/types';
import type { UseDigitalAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type DigitalAssetListParams = UseDigitalAssetsParams & { include?: DigitalAssetInclude };

/**
 * Create a `useDigitalAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for digital asset lists
 */
export function createUseDigitalAssets(
  queryFn: (
    params: DigitalAssetListParams,
  ) => Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>,
) {
  const impl = createUseList<
    DigitalAssetListParams,
    PartialDigitalAsset,
    FetchDigitalAssetsResult<PartialDigitalAsset>
  >({
    queryKey: (p) => digitalAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.digitalAssets,
  });

  function useDigitalAssets<const I extends DigitalAssetInclude>(
    params: UseDigitalAssetsParams & { include: I },
  ): UseDigitalAssetsReturn<DigitalAssetResult<I>>;
  function useDigitalAssets(
    params?: Omit<UseDigitalAssetsParams, 'include'> & { include?: never },
  ): UseDigitalAssetsReturn<DigitalAsset>;
  function useDigitalAssets(
    params: UseDigitalAssetsParams & { include?: DigitalAssetInclude },
  ): UseDigitalAssetsReturn<PartialDigitalAsset>;
  function useDigitalAssets(
    params: UseDigitalAssetsParams & { include?: DigitalAssetInclude } = {},
  ): UseDigitalAssetsReturn<PartialDigitalAsset> {
    const { items, ...rest } = impl(params);
    return { digitalAssets: items, ...rest };
  }

  return useDigitalAssets;
}
