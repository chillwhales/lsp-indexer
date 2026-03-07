/** @see createUseInfinite */
import { type FetchFollowsResult, followerKeys } from '@lsp-indexer/node';
import {
  type Follower,
  type FollowerInclude,
  type FollowerResult,
  type PartialFollower,
  type UseInfiniteFollowsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteFollowsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type FollowsInfiniteParams = UseInfiniteFollowsParams & {
  include?: FollowerInclude;
};

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
