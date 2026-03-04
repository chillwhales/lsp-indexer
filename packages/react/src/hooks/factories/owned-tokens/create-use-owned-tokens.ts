/**
 * Factory for useOwnedTokens — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseOwnedTokens(queryFn)` with its own fetch function:
 * - React: `(p) => fetchOwnedTokens(getClientUrl(), p)`
 * - Next:  `(p) => getOwnedTokens(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchOwnedTokensResult } from '@lsp-indexer/node';
import { ownedTokenKeys } from '@lsp-indexer/node';
import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
  UseOwnedTokensParams,
} from '@lsp-indexer/types';
import type { UseOwnedTokensReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type OwnedTokenListParams = UseOwnedTokensParams & { include?: OwnedTokenInclude };

/**
 * Create a `useOwnedTokens` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for owned token lists
 */
export function createUseOwnedTokens(
  queryFn: (params: OwnedTokenListParams) => Promise<FetchOwnedTokensResult<PartialOwnedToken>>,
) {
  const impl = createUseList<
    OwnedTokenListParams,
    PartialOwnedToken,
    FetchOwnedTokensResult<PartialOwnedToken>
  >({
    queryKey: (p) => ownedTokenKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.ownedTokens,
  });

  function useOwnedTokens<const I extends OwnedTokenInclude>(
    params: UseOwnedTokensParams & { include: I },
  ): UseOwnedTokensReturn<OwnedTokenResult<I>>;
  function useOwnedTokens(
    params?: Omit<UseOwnedTokensParams, 'include'> & { include?: never },
  ): UseOwnedTokensReturn<OwnedToken>;
  function useOwnedTokens(
    params: UseOwnedTokensParams & { include?: OwnedTokenInclude },
  ): UseOwnedTokensReturn<PartialOwnedToken>;
  function useOwnedTokens(
    params: UseOwnedTokensParams & { include?: OwnedTokenInclude } = {},
  ): UseOwnedTokensReturn<PartialOwnedToken> {
    const { items, ...rest } = impl(params);
    return { ownedTokens: items, ...rest };
  }

  return useOwnedTokens;
}
