/** @see createUseInfinite */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseInfiniteMutualFollowsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteMutualFollowsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type MutualFollowsInfiniteParams = UseInfiniteMutualFollowsParams & { include?: ProfileInclude };

export function createUseInfiniteMutualFollows(
  queryFn: (
    params: MutualFollowsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseInfinite<
    MutualFollowsInfiniteParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.infiniteMutualFollows(p.addressA, p.addressB, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
    enabled: (p) => Boolean(p.addressA) && Boolean(p.addressB),
  });

  function useInfiniteMutualFollows<const I extends ProfileInclude>(
    params: UseInfiniteMutualFollowsParams & { include: I },
  ): UseInfiniteMutualFollowsReturn<ProfileResult<I>>;
  function useInfiniteMutualFollows(
    params: Omit<UseInfiniteMutualFollowsParams, 'include'> & { include?: never },
  ): UseInfiniteMutualFollowsReturn<Profile>;
  function useInfiniteMutualFollows(
    params: UseInfiniteMutualFollowsParams & { include?: ProfileInclude },
  ): UseInfiniteMutualFollowsReturn<PartialProfile>;
  function useInfiniteMutualFollows(
    params: UseInfiniteMutualFollowsParams & { include?: ProfileInclude },
  ): UseInfiniteMutualFollowsReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useInfiniteMutualFollows;
}
