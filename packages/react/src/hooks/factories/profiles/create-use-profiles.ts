/** @see createUseList */
import type { FetchProfilesResult } from '@lsp-indexer/node';
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfilesParams,
} from '@lsp-indexer/types';
import type { UseProfilesReturn } from '../../types';
import { createUseList } from '../create-use-list';

type ProfileListParams = UseProfilesParams & { include?: ProfileInclude };

export function createUseProfiles(
  queryFn: (params: ProfileListParams) => Promise<FetchProfilesResult<PartialProfile>>,
) {
  const impl = createUseList<
    ProfileListParams,
    PartialProfile,
    FetchProfilesResult<PartialProfile>
  >({
    queryKey: (p) => profileKeys.list(p.filter, p.sort, p.limit, p.offset, p.include),
    queryFn,
    extractItems: (r) => r.profiles,
  });

  function useProfiles<const I extends ProfileInclude>(
    params: UseProfilesParams & { include: I },
  ): UseProfilesReturn<ProfileResult<I>>;
  function useProfiles(
    params?: Omit<UseProfilesParams, 'include'> & { include?: never },
  ): UseProfilesReturn<Profile>;
  function useProfiles(
    params: UseProfilesParams & { include?: ProfileInclude },
  ): UseProfilesReturn<PartialProfile>;
  function useProfiles(
    params: UseProfilesParams & { include?: ProfileInclude } = {},
  ): UseProfilesReturn<PartialProfile> {
    const { items, ...rest } = impl(params);
    return { profiles: items, ...rest };
  }

  return useProfiles;
}
