/**
 * Factory for useInfiniteOwnedTokens — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteOwnedTokens(queryFn)` with its own fetch:
 * - React: `(p) => fetchOwnedTokens(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedTokens(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchOwnedTokensResult } from '@lsp-indexer/node';
import { ownedTokenKeys } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
  UseInfiniteOwnedTokensParams,
} from '@lsp-indexer/types';
import type { UseInfiniteOwnedTokensReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteOwnedTokensParams with optional include */
type OwnedTokenInfiniteParams = UseInfiniteOwnedTokensParams & {
  include?: OwnedTokenInclude;
};

/**
 * Create a `useInfiniteOwnedTokens` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for owned token lists (with limit + offset)
 */
export function createUseInfiniteOwnedTokens(
  queryFn: (
    params: OwnedTokenInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchOwnedTokensResult<PartialOwnedToken>>,
) {
  const impl = createUseInfinite<
    OwnedTokenInfiniteParams,
    PartialOwnedToken,
    FetchOwnedTokensResult<PartialOwnedToken>
  >({
    queryKey: (p) => ownedTokenKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.ownedTokens,
  });

  function useInfiniteOwnedTokens<const I extends OwnedTokenInclude>(
    params: UseInfiniteOwnedTokensParams & { include: I },
  ): UseInfiniteOwnedTokensReturn<OwnedTokenResult<I>>;
  function useInfiniteOwnedTokens(
    params?: Omit<UseInfiniteOwnedTokensParams, 'include'> & { include?: never },
  ): UseInfiniteOwnedTokensReturn<OwnedToken>;
  function useInfiniteOwnedTokens(
    params: UseInfiniteOwnedTokensParams & { include?: OwnedTokenInclude },
  ): UseInfiniteOwnedTokensReturn<PartialOwnedToken>;
  function useInfiniteOwnedTokens(
    params: UseInfiniteOwnedTokensParams & { include?: OwnedTokenInclude } = {},
  ): UseInfiniteOwnedTokensReturn<PartialOwnedToken> {
    const { items, ...rest } = impl(params);
    return { ownedTokens: items, ...rest };
  }

  return useInfiniteOwnedTokens;
}
