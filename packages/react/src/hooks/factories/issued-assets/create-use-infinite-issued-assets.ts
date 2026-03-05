/**
 * Factory for useInfiniteIssuedAssets — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteIssuedAssets(queryFn)` with its own fetch:
 * - React: `(p) => fetchIssuedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getIssuedAssets(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
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

/** Params passed to the factory — matches UseInfiniteIssuedAssetsParams with optional include */
type IssuedAssetsInfiniteParams = UseInfiniteIssuedAssetsParams & {
  include?: IssuedAssetInclude;
};

/**
 * Create a `useInfiniteIssuedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for issued asset lists (with limit + offset)
 */
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
