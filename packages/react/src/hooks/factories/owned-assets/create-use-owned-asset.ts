/**
 * Factory for useOwnedAsset — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedAsset(queryFn)` with its own fetch function:
 * - React: `(p) => fetchOwnedAsset(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedAsset(p.id, p.include)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { ownedAssetKeys } from '@lsp-indexer/node';
import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
  UseOwnedAssetParams,
} from '@lsp-indexer/types';
import type { UseOwnedAssetReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — id + optional include */
type OwnedAssetDetailParams = UseOwnedAssetParams & { include?: OwnedAssetInclude };

/**
 * Create a `useOwnedAsset` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for a single owned asset
 */
export function createUseOwnedAsset(
  queryFn: (params: OwnedAssetDetailParams) => Promise<PartialOwnedAsset | null>,
) {
  const impl = createUseDetail<OwnedAssetDetailParams, PartialOwnedAsset>({
    queryKey: (p) => ownedAssetKeys.detail(p.id, p.include),
    queryFn,
    enabled: (p) => Boolean(p.id),
  });

  function useOwnedAsset<const I extends OwnedAssetInclude>(
    params: UseOwnedAssetParams & { include: I },
  ): UseOwnedAssetReturn<OwnedAssetResult<I>>;
  function useOwnedAsset(
    params: Omit<UseOwnedAssetParams, 'include'> & { include?: never },
  ): UseOwnedAssetReturn<OwnedAsset>;
  function useOwnedAsset(
    params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
  ): UseOwnedAssetReturn<PartialOwnedAsset>;
  function useOwnedAsset(
    params: UseOwnedAssetParams & { include?: OwnedAssetInclude },
  ): UseOwnedAssetReturn<PartialOwnedAsset> {
    const { data, ...rest } = impl(params);
    return { ownedAsset: data, ...rest };
  }

  return useOwnedAsset;
}
