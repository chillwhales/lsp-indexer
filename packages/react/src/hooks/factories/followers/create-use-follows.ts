/**
 * Factory for useFollows — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseFollows(queryFn)` with its own fetch function:
 * - React: `(p) => fetchFollows(getClientUrl(), p)`
 * - Next:  `(p) => getFollows(p)`
 *
 * @see createUseList — the generic factory this wraps
 */
import type { FetchFollowsResult } from '@lsp-indexer/node';
import { followerKeys } from '@lsp-indexer/node';
import type {
  Follower,
  FollowerInclude,
  FollowerResult,
  PartialFollower,
  UseFollowsParams,
} from '@lsp-indexer/types';
import type { UseFollowsReturn } from '../../types';
import { createUseList } from '../create-use-list';

/** Params passed to the factory's queryFn */
type FollowsListParams = UseFollowsParams & { include?: FollowerInclude };

/**
 * Create a `useFollows` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for follow lists
 */
export function createUseFollows(
  queryFn: (params: FollowsListParams) => Promise<FetchFollowsResult<PartialFollower>>,
) {
  const impl = createUseList<
    FollowsListParams,
    PartialFollower,
    FetchFollowsResult<PartialFollower>
  >({
    queryKey: (p) => followerKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.follows,
  });

  function useFollows<const I extends FollowerInclude>(
    params: UseFollowsParams & { include: I },
  ): UseFollowsReturn<FollowerResult<I>>;
  function useFollows(
    params: Omit<UseFollowsParams, 'include'> & { include?: never },
  ): UseFollowsReturn<Follower>;
  function useFollows(
    params: UseFollowsParams & { include?: FollowerInclude },
  ): UseFollowsReturn<PartialFollower>;
  function useFollows(
    params: UseFollowsParams & { include?: FollowerInclude },
  ): UseFollowsReturn<PartialFollower> {
    const { items, ...rest } = impl(params);
    return { follows: items, ...rest };
  }

  return useFollows;
}
