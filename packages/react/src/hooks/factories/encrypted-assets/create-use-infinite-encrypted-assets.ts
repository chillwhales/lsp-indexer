/**
 * Factory for useInfiniteEncryptedAssets — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteEncryptedAssets(queryFn)` with its own fetch:
 * - React: `(p) => fetchEncryptedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getEncryptedAssets(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchEncryptedAssetsResult } from '@lsp-indexer/node';
import { encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  EncryptedAsset,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
  UseInfiniteEncryptedAssetsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteEncryptedAssetsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteEncryptedAssetsParams with optional include */
type EncryptedAssetsInfiniteParams = UseInfiniteEncryptedAssetsParams & {
  include?: EncryptedAssetInclude;
};

/**
 * Create a `useInfiniteEncryptedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for encrypted asset lists (with limit + offset)
 */
export function createUseInfiniteEncryptedAssets(
  queryFn: (
    params: EncryptedAssetsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>>,
) {
  const impl = createUseInfinite<
    EncryptedAssetsInfiniteParams,
    PartialEncryptedAsset,
    FetchEncryptedAssetsResult<PartialEncryptedAsset>
  >({
    queryKey: (p) => encryptedAssetKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.encryptedAssets,
  });

  function useInfiniteEncryptedAssets<const I extends EncryptedAssetInclude>(
    params: UseInfiniteEncryptedAssetsParams & { include: I },
  ): UseInfiniteEncryptedAssetsReturn<EncryptedAssetResult<I>>;
  function useInfiniteEncryptedAssets(
    params?: Omit<UseInfiniteEncryptedAssetsParams, 'include'> & { include?: never },
  ): UseInfiniteEncryptedAssetsReturn<EncryptedAsset>;
  function useInfiniteEncryptedAssets(
    params: UseInfiniteEncryptedAssetsParams & { include?: EncryptedAssetInclude },
  ): UseInfiniteEncryptedAssetsReturn<PartialEncryptedAsset>;
  function useInfiniteEncryptedAssets(
    params: UseInfiniteEncryptedAssetsParams & { include?: EncryptedAssetInclude } = {},
  ): UseInfiniteEncryptedAssetsReturn<PartialEncryptedAsset> {
    const { items, ...rest } = impl(params);
    return { encryptedAssets: items, ...rest };
  }

  return useInfiniteEncryptedAssets;
}
