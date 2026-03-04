/**
 * Factory for useInfiniteOwnedAssets — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteOwnedAssets(queryFn)` with its own fetch:
 * - React: `(p) => fetchOwnedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedAssets(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchOwnedAssetsResult } from '@lsp-indexer/node';
import { ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseInfiniteOwnedAssetsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteOwnedAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteOwnedAssetsParams with optional include */
type OwnedAssetInfiniteParams = UseInfiniteOwnedAssetsParams & {
  include?: OwnedAssetInclude;
};

/**
 * Create a `useInfiniteOwnedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for owned asset lists (with limit + offset)
 */
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
