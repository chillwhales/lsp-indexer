/** @see createUseList */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseMutualFollowsParams,
} from '@lsp-indexer/types';
import { type UseMutualFollowsReturn } from '../../types';
import { createUseList } from '../create-use-list';

type MutualFollowsListParams = UseMutualFollowsParams & { include?: ProfileInclude };

export function createUseMutualFollows(
  queryFn: (params: MutualFollowsListParams) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseList<
    MutualFollowsListParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.mutualFollows(p.addressA, p.addressB, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
    enabled: (p) => Boolean(p.addressA) && Boolean(p.addressB),
  });

  function useMutualFollows<const I extends ProfileInclude>(
    params: UseMutualFollowsParams & { include: I },
  ): UseMutualFollowsReturn<ProfileResult<I>>;
  function useMutualFollows(
    params: Omit<UseMutualFollowsParams, 'include'> & { include?: never },
  ): UseMutualFollowsReturn<Profile>;
  function useMutualFollows(
    params: UseMutualFollowsParams & { include?: ProfileInclude },
  ): UseMutualFollowsReturn<PartialProfile>;
  function useMutualFollows(
    params: UseMutualFollowsParams & { include?: ProfileInclude },
  ): UseMutualFollowsReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useMutualFollows;
}
