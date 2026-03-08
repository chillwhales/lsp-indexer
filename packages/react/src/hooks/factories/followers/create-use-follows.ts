/** @see createUseList */
import { type FetchFollowsResult, followerKeys } from '@lsp-indexer/node';
import {
  type Follower,
  type FollowerInclude,
  type FollowerResult,
  type PartialFollower,
  type UseFollowsParams,
} from '@lsp-indexer/types';
import { type UseFollowsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type FollowsListParams = UseFollowsParams & { include?: FollowerInclude };

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
