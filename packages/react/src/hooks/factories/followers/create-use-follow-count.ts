import { followerKeys } from '@lsp-indexer/node';
import type { FollowCount, UseFollowCountParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseFollowCountReturn } from '../../types';

export function createUseFollowCount(
  queryFn: (params: UseFollowCountParams) => Promise<FollowCount>,
) {
  function useFollowCount(params: UseFollowCountParams): UseFollowCountReturn {
    const { address, network } = params;

    const { data, ...rest } = useQuery({
      queryKey: followerKeys.count(network, address),
      queryFn: () => queryFn(params),
      enabled: Boolean(address),
    });

    return {
      followerCount: data?.followerCount ?? 0,
      followingCount: data?.followingCount ?? 0,
      ...rest,
    };
  }

  return useFollowCount;
}
