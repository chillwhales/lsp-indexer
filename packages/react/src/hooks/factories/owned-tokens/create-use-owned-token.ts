/**
 * Factory for useOwnedToken — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedToken(queryFn)` with its own fetch function:
 * - React: `(p) => fetchOwnedToken(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedToken(p.id, p.include)`
 *
 * @see createUseDetail — the generic factory this wraps
 */
import { ownedTokenKeys } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
  UseOwnedTokenParams,
} from '@lsp-indexer/types';
import type { UseOwnedTokenReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

/** Params passed to the factory's queryFn — id + optional include */
type OwnedTokenDetailParams = UseOwnedTokenParams & { include?: OwnedTokenInclude };

/**
 * Create a `useOwnedToken` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for a single owned token
 */
export function createUseOwnedToken(
  queryFn: (params: OwnedTokenDetailParams) => Promise<PartialOwnedToken | null>,
) {
  const impl = createUseDetail<OwnedTokenDetailParams, PartialOwnedToken>({
    queryKey: (p) => ownedTokenKeys.detail(p.id, p.include),
    queryFn,
    enabled: (p) => Boolean(p.id),
  });

  function useOwnedToken<const I extends OwnedTokenInclude>(
    params: UseOwnedTokenParams & { include: I },
  ): UseOwnedTokenReturn<OwnedTokenResult<I>>;
  function useOwnedToken(
    params: Omit<UseOwnedTokenParams, 'include'> & { include?: never },
  ): UseOwnedTokenReturn<OwnedToken>;
  function useOwnedToken(
    params: UseOwnedTokenParams & { include?: OwnedTokenInclude },
  ): UseOwnedTokenReturn<PartialOwnedToken>;
  function useOwnedToken(
    params: UseOwnedTokenParams & { include?: OwnedTokenInclude },
  ): UseOwnedTokenReturn<PartialOwnedToken> {
    const { data, ...rest } = impl(params);
    return { ownedToken: data, ...rest };
  }

  return useOwnedToken;
}
