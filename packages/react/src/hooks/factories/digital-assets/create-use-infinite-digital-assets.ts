/**
 * Factory for useInfiniteDigitalAssets — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteDigitalAssets(queryFn)` with its own fetch:
 * - React: `(p) => fetchDigitalAssets(getClientUrl(), p)`
 * - Next:  `(p) => getDigitalAssets(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchDigitalAssetsResult } from '@lsp-indexer/node';
import { digitalAssetKeys } from '@lsp-indexer/node';
import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  UseInfiniteDigitalAssetsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteDigitalAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteDigitalAssetsParams with optional include */
type DigitalAssetInfiniteParams = UseInfiniteDigitalAssetsParams & {
  include?: DigitalAssetInclude;
};

/**
 * Create a `useInfiniteDigitalAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for digital asset lists (with limit + offset)
 */
export function createUseInfiniteDigitalAssets(
  queryFn: (
    params: DigitalAssetInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchDigitalAssetsResult<PartialDigitalAsset>>,
) {
  const impl = createUseInfinite<
    DigitalAssetInfiniteParams,
    PartialDigitalAsset,
    FetchDigitalAssetsResult<PartialDigitalAsset>
  >({
    queryKey: (p) => digitalAssetKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.digitalAssets,
  });

  function useInfiniteDigitalAssets<const I extends DigitalAssetInclude>(
    params: UseInfiniteDigitalAssetsParams & { include: I },
  ): UseInfiniteDigitalAssetsReturn<DigitalAssetResult<I>>;
  function useInfiniteDigitalAssets(
    params?: Omit<UseInfiniteDigitalAssetsParams, 'include'> & { include?: never },
  ): UseInfiniteDigitalAssetsReturn<DigitalAsset>;
  function useInfiniteDigitalAssets(
    params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude },
  ): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset>;
  function useInfiniteDigitalAssets(
    params: UseInfiniteDigitalAssetsParams & { include?: DigitalAssetInclude } = {},
  ): UseInfiniteDigitalAssetsReturn<PartialDigitalAsset> {
    const { items, ...rest } = impl(params);
    return { digitalAssets: items, ...rest };
  }

  return useInfiniteDigitalAssets;
}
