import { followerKeys } from '@lsp-indexer/node';
import type { UseIsFollowingParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseIsFollowingReturn } from '../../types';

export function createUseIsFollowing(
  queryFn: (followerAddress: string, followedAddress: string) => Promise<boolean>,
) {
  function useIsFollowing(params: UseIsFollowingParams): UseIsFollowingReturn {
    const { followerAddress, followedAddress } = params;

    const { data, ...rest } = useQuery({
      queryKey: followerKeys.isFollowing(followerAddress, followedAddress),
      queryFn: () => queryFn(followerAddress, followedAddress),
      enabled: Boolean(followerAddress) && Boolean(followedAddress),
    });

    return {
      isFollowing: data ?? false,
      ...rest,
    };
  }

  return useIsFollowing;
}
