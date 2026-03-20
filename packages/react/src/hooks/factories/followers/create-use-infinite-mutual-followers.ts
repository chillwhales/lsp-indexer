/** @see createUseInfinite */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseInfiniteMutualFollowersParams,
} from '@lsp-indexer/types';
import { type UseInfiniteMutualFollowersReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type MutualFollowersInfiniteParams = UseInfiniteMutualFollowersParams & {
  include?: ProfileInclude;
};

export function createUseInfiniteMutualFollowers(
  queryFn: (
    params: MutualFollowersInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseInfinite<
    MutualFollowersInfiniteParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.infiniteMutualFollowers(p.addressA, p.addressB, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useInfiniteMutualFollowers<const I extends ProfileInclude>(
    params: UseInfiniteMutualFollowersParams & { include: I },
  ): UseInfiniteMutualFollowersReturn<ProfileResult<I>>;
  function useInfiniteMutualFollowers(
    params: Omit<UseInfiniteMutualFollowersParams, 'include'> & { include?: never },
  ): UseInfiniteMutualFollowersReturn<Profile>;
  function useInfiniteMutualFollowers(
    params: UseInfiniteMutualFollowersParams & { include?: ProfileInclude },
  ): UseInfiniteMutualFollowersReturn<PartialProfile>;
  function useInfiniteMutualFollowers(
    params: UseInfiniteMutualFollowersParams & { include?: ProfileInclude },
  ): UseInfiniteMutualFollowersReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useInfiniteMutualFollowers;
}
