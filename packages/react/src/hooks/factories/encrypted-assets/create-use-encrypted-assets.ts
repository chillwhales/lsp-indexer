/**
 * Factory for useEncryptedAssets — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseEncryptedAssets(queryFn)` with its own fetch function:
 * - React: `(p) => fetchEncryptedAssets(getClientUrl(), p)`
 * - Next:  `(p) => getEncryptedAssets(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchEncryptedAssetsResult } from '@lsp-indexer/node';
import { encryptedAssetKeys } from '@lsp-indexer/node';
import type {
  EncryptedAsset,
  EncryptedAssetInclude,
  EncryptedAssetResult,
  PartialEncryptedAsset,
  UseEncryptedAssetsParams,
} from '@lsp-indexer/types';
import type { UseEncryptedAssetsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type EncryptedAssetsListParams = UseEncryptedAssetsParams & { include?: EncryptedAssetInclude };

/**
 * Create a `useEncryptedAssets` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for encrypted asset lists
 */
export function createUseEncryptedAssets(
  queryFn: (
    params: EncryptedAssetsListParams,
  ) => Promise<FetchEncryptedAssetsResult<PartialEncryptedAsset>>,
) {
  const impl = createUseList<
    EncryptedAssetsListParams,
    PartialEncryptedAsset,
    FetchEncryptedAssetsResult<PartialEncryptedAsset>
  >({
    queryKey: (p) => encryptedAssetKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.encryptedAssets,
  });

  function useEncryptedAssets<const I extends EncryptedAssetInclude>(
    params: UseEncryptedAssetsParams & { include: I },
  ): UseEncryptedAssetsReturn<EncryptedAssetResult<I>>;
  function useEncryptedAssets(
    params?: Omit<UseEncryptedAssetsParams, 'include'> & { include?: never },
  ): UseEncryptedAssetsReturn<EncryptedAsset>;
  function useEncryptedAssets(
    params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude },
  ): UseEncryptedAssetsReturn<PartialEncryptedAsset>;
  function useEncryptedAssets(
    params: UseEncryptedAssetsParams & { include?: EncryptedAssetInclude } = {},
  ): UseEncryptedAssetsReturn<PartialEncryptedAsset> {
    const { items, ...rest } = impl(params);
    return { encryptedAssets: items, ...rest };
  }

  return useEncryptedAssets;
}
