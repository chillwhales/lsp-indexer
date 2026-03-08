/** @see createUseInfinite */
import { type FetchOwnedTokensResult, ownedTokenKeys } from '@lsp-indexer/node';
import {
  type OwnedToken,
  type OwnedTokenInclude,
  type OwnedTokenResult,
  type PartialOwnedToken,
  type UseInfiniteOwnedTokensParams,
} from '@lsp-indexer/types';
import { type UseInfiniteOwnedTokensReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type OwnedTokenInfiniteParams = UseInfiniteOwnedTokensParams & {
  include?: OwnedTokenInclude;
};

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
