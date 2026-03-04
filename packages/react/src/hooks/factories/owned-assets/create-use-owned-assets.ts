/**
 * Factory for useOwnedAssets — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedAssets(queryFn)` with its own fetch function:
 * - React: `(p) => fetchOwnedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedAssets(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import { ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseOwnedAssetsParams,
} from '@lsp-indexer/types';
import type { UseOwnedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type OwnedAssetListParams = UseOwnedAssetsParams & { include?: OwnedAssetInclude };

/**
 * Create a `useOwnedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for owned asset lists
 */
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
