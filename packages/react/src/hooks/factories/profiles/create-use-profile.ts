/** @see createUseDetail */
import { profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseProfileParams,
} from '@lsp-indexer/types';
import type { UseProfileReturn } from '../../types';
import { createUseDetail } from '../create-use-detail';

type ProfileDetailParams = UseProfileParams & { include?: ProfileInclude };

export function createUseProfile(
  queryFn: (params: ProfileDetailParams) => Promise<PartialProfile | null>,
) {
  const impl = createUseDetail<ProfileDetailParams, PartialProfile>({
    queryKey: (p) => profileKeys.detail(p.address, p.include),
    queryFn,
    enabled: (p) => Boolean(p.address),
  });

  function useProfile<const I extends ProfileInclude>(
    params: UseProfileParams & { include: I },
  ): UseProfileReturn<ProfileResult<I>>;
  function useProfile(
    params: Omit<UseProfileParams, 'include'> & { include?: never },
  ): UseProfileReturn<Profile>;
  function useProfile(
    params: UseProfileParams & { include?: ProfileInclude },
  ): UseProfileReturn<PartialProfile>;
  function useProfile(
    params: UseProfileParams & { include?: ProfileInclude },
  ): UseProfileReturn<PartialProfile> {
    const { data, ...rest } = impl(params);
    return { profile: data, ...rest };
  }

  return useProfile;
}
