import { followerKeys } from '@lsp-indexer/node';
import type { FollowCount, UseFollowCountParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseFollowCountReturn } from '../../types';

export function createUseFollowCount(queryFn: (address: string) => Promise<FollowCount>) {
  function useFollowCount(params: UseFollowCountParams): UseFollowCountReturn {
    const { address } = params;

    const { data, ...rest } = useQuery({
      queryKey: followerKeys.count(address),
      queryFn: () => queryFn(address),
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
