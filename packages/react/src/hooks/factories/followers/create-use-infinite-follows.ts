/**
 * Factory for useInfiniteFollows — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseInfiniteFollows(queryFn)` with its own fetch:
 * - React: `(p) => fetchFollows(getClientUrl(), p)`
 * - Next:  `(p) => getFollows(p)`
 *
 * @see createUseInfinite — the generic factory this wraps
 */
import type { FetchFollowsResult } from '@lsp-indexer/node';
import { followerKeys } from '@lsp-indexer/node';
import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
  UseInfiniteFollowsParams,
} from '@lsp-indexer/types';
import type { UseInfiniteFollowsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

/** Params passed to the factory — matches UseInfiniteFollowsParams with optional include */
type FollowsInfiniteParams = UseInfiniteFollowsParams & {
  include?: FollowerInclude;
};

/**
 * Create a `useInfiniteFollows` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for follow lists (with limit + offset)
 */
export function createUseInfiniteFollows(
  queryFn: (
    params: FollowsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchFollowsResult<PartialFollower>>,
) {
  const impl = createUseInfinite<
    FollowsInfiniteParams,
    PartialFollower,
    FetchFollowsResult<PartialFollower>
  >({
    queryKey: (p) => followerKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.follows,
  });

  function useInfiniteFollows<const I extends FollowerInclude>(
    params: UseInfiniteFollowsParams & { include: I },
  ): UseInfiniteFollowsReturn<FollowerResult<I>>;
  function useInfiniteFollows(
    params?: Omit<UseInfiniteFollowsParams, 'include'> & { include?: never },
  ): UseInfiniteFollowsReturn<Follower>;
  function useInfiniteFollows(
    params: UseInfiniteFollowsParams & { include?: FollowerInclude },
  ): UseInfiniteFollowsReturn<PartialFollower>;
  function useInfiniteFollows(
    params: UseInfiniteFollowsParams & { include?: FollowerInclude } = {},
  ): UseInfiniteFollowsReturn<PartialFollower> {
    const { items, ...rest } = impl(params);
    return { follows: items, ...rest };
  }

  return useInfiniteFollows;
}
