/**
 * Factory for useIssuedAssets — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseIssuedAssets(queryFn)` with its own fetch function:
 * - React: `(p) => fetchIssuedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getIssuedAssets(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchIssuedAssetsResult } from '@lsp-indexer/node';
import { issuedAssetKeys } from '@lsp-indexer/node';
import type {
  IssuedAsset,
  IssuedAssetInclude,
  IssuedAssetResult,
  PartialIssuedAsset,
  UseIssuedAssetsParams,
} from '@lsp-indexer/types';
import type { UseIssuedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type IssuedAssetsListParams = UseIssuedAssetsParams & { include?: IssuedAssetInclude };

/**
 * Create a `useIssuedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for issued asset lists
 */
export function createUseIssuedAssets(
  queryFn: (params: IssuedAssetsListParams) => Promise<FetchIssuedAssetsResult<PartialIssuedAsset>>,
) {
  const impl = createUseList<
    IssuedAssetsListParams,
    PartialIssuedAsset,
    FetchIssuedAssetsResult<PartialIssuedAsset>
  >({
    queryKey: (p) => issuedAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.issuedAssets,
  });

  function useIssuedAssets<const I extends IssuedAssetInclude>(
    params: UseIssuedAssetsParams & { include: I },
  ): UseIssuedAssetsReturn<IssuedAssetResult<I>>;
  function useIssuedAssets(
    params?: Omit<UseIssuedAssetsParams, 'include'> & { include?: never },
  ): UseIssuedAssetsReturn<IssuedAsset>;
  function useIssuedAssets(
    params: UseIssuedAssetsParams & { include?: IssuedAssetInclude },
  ): UseIssuedAssetsReturn<PartialIssuedAsset>;
  function useIssuedAssets(
    params: UseIssuedAssetsParams & { include?: IssuedAssetInclude } = {},
  ): UseIssuedAssetsReturn<PartialIssuedAsset> {
    const { items, ...rest } = impl(params);
    return { issuedAssets: items, ...rest };
  }

  return useIssuedAssets;
}
