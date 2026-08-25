import { followerKeys } from '@lsp-indexer/node';
import type { UseIsFollowingParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseIsFollowingReturn } from '../../types';

export function createUseIsFollowing(queryFn: (params: UseIsFollowingParams) => Promise<boolean>) {
  function useIsFollowing(params: UseIsFollowingParams): UseIsFollowingReturn {
    const { followedAddress, followerAddress, network } = params;

    const { data, ...rest } = useQuery({
      queryKey: followerKeys.isFollowing(network, followerAddress, followedAddress),
      queryFn: () => queryFn(params),
      enabled: Boolean(followerAddress) && Boolean(followedAddress),
    });

    return {
      isFollowing: data ?? false,
      ...rest,
    };
  }

  return useIsFollowing;
}
