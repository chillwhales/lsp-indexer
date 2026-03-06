/** @see createUseInfinite */
import type { FetchProfilesResult } from '@lsp-indexer/node';
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseInfiniteProfilesParams,
} from '@lsp-indexer/types';
import type { UseInfiniteProfilesReturn } from '../../types';
import { createUseInfinite } from '../create-use-infinite';

type ProfileInfiniteParams = UseInfiniteProfilesParams & { include?: ProfileInclude };

export function createUseInfiniteProfiles(
  queryFn: (
    params: ProfileInfiniteParams & { limit: number; offset: number },
  ) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseInfinite<
    ProfileInfiniteParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) => profileKeys.infinite(p.filter, p.sort, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useInfiniteProfiles<const I extends ProfileInclude>(
    params: UseInfiniteProfilesParams & { include: I },
  ): UseInfiniteProfilesReturn<ProfileResult<I>>;
  function useInfiniteProfiles(
    params?: Omit<UseInfiniteProfilesParams, 'include'> & { include?: never },
  ): UseInfiniteProfilesReturn<Profile>;
  function useInfiniteProfiles(
    params: UseInfiniteProfilesParams & { include?: ProfileInclude },
  ): UseInfiniteProfilesReturn<PartialProfile>;
  function useInfiniteProfiles(
    params: UseInfiniteProfilesParams & { include?: ProfileInclude } = {},
  ): UseInfiniteProfilesReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useInfiniteProfiles;
}
