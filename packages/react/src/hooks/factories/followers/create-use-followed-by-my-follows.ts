/** @see createUseList */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseFollowedByMyFollowsParams,
} from '@lsp-indexer/types';
import { type UseFollowedByMyFollowsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type FollowedByMyFollowsListParams = UseFollowedByMyFollowsParams & { include?: ProfileInclude };

export function createUseFollowedByMyFollows(
  queryFn: (params: FollowedByMyFollowsListParams) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseList<
    FollowedByMyFollowsListParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.followedByMyFollows(
        p.myAddress,
        p.targetAddress,
        p.sort,
        p.limit,
        p.offset,
        p.include,
      ),
    queryFn,
    extractItems: (r) => r.profiles,
    enabled: (p) => Boolean(p.myAddress) && Boolean(p.targetAddress),
  });

  function useFollowedByMyFollows<const I extends ProfileInclude>(
    params: UseFollowedByMyFollowsParams & { include: I },
  ): UseFollowedByMyFollowsReturn<ProfileResult<I>>;
  function useFollowedByMyFollows(
    params: Omit<UseFollowedByMyFollowsParams, 'include'> & { include?: never },
  ): UseFollowedByMyFollowsReturn<Profile>;
  function useFollowedByMyFollows(
    params: UseFollowedByMyFollowsParams & { include?: ProfileInclude },
  ): UseFollowedByMyFollowsReturn<PartialProfile>;
  function useFollowedByMyFollows(
    params: UseFollowedByMyFollowsParams & { include?: ProfileInclude },
  ): UseFollowedByMyFollowsReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useFollowedByMyFollows;
}
