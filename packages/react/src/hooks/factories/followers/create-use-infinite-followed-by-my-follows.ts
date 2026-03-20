/** @see createUseInfinite */
import { type FetchProfilesResult, followerKeys } from '@lsp-indexer/node';
import {
  type PartialProfile,
  type Profile,
  type ProfileInclude,
  type ProfileResult,
  type UseInfiniteFollowedByMyFollowsParams,
} from '@lsp-indexer/types';
import { type UseInfiniteFollowedByMyFollowsReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type FollowedByMyFollowsInfiniteParams = UseInfiniteFollowedByMyFollowsParams & {
  include?: ProfileInclude;
};

export function createUseInfiniteFollowedByMyFollows(
  queryFn: (
    params: FollowedByMyFollowsInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseInfinite<
    FollowedByMyFollowsInfiniteParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) =>
      followerKeys.infiniteFollowedByMyFollows(p.myAddress, p.targetAddress, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useInfiniteFollowedByMyFollows<const I extends ProfileInclude>(
    params: UseInfiniteFollowedByMyFollowsParams & { include: I },
  ): UseInfiniteFollowedByMyFollowsReturn<ProfileResult<I>>;
  function useInfiniteFollowedByMyFollows(
    params: Omit<UseInfiniteFollowedByMyFollowsParams, 'include'> & { include?: never },
  ): UseInfiniteFollowedByMyFollowsReturn<Profile>;
  function useInfiniteFollowedByMyFollows(
    params: UseInfiniteFollowedByMyFollowsParams & { include?: ProfileInclude },
  ): UseInfiniteFollowedByMyFollowsReturn<PartialProfile>;
  function useInfiniteFollowedByMyFollows(
    params: UseInfiniteFollowedByMyFollowsParams & { include?: ProfileInclude },
  ): UseInfiniteFollowedByMyFollowsReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useInfiniteFollowedByMyFollows;
}
