/** @see createUseList */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseMutualFollowersParams,
} from '@lsp-indexer/types';
import { type UseMutualFollowersReturn } from '../../types';
import { createUseList } from '../create-use-list';

type MutualFollowersListParams = UseMutualFollowersParams & { include?: ProfileInclude };

export function createUseMutualFollowers(
  queryFn: (params: MutualFollowersListParams) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseList<
    MutualFollowersListParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.mutualFollowers(p.addressA, p.addressB, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
    enabled: (p) => Boolean(p.addressA) && Boolean(p.addressB),
  });

  function useMutualFollowers<const I extends ProfileInclude>(
    params: UseMutualFollowersParams & { include: I },
  ): UseMutualFollowersReturn<ProfileResult<I>>;
  function useMutualFollowers(
    params: Omit<UseMutualFollowersParams, 'include'> & { include?: never },
  ): UseMutualFollowersReturn<Profile>;
  function useMutualFollowers(
    params: UseMutualFollowersParams & { include?: ProfileInclude },
  ): UseMutualFollowersReturn<PartialProfile>;
  function useMutualFollowers(
    params: UseMutualFollowersParams & { include?: ProfileInclude },
  ): UseMutualFollowersReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useMutualFollowers;
}
