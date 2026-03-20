import { followerKeys } from '@lsp-indexer/node';
import type { UseIsFollowingBatchParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseIsFollowingBatchReturn } from '../../types';

export function createUseIsFollowingBatch(
  queryFn: (pairs: UseIsFollowingBatchParams['pairs']) => Promise<Map<string, boolean>>,
) {
  function useIsFollowingBatch(params: UseIsFollowingBatchParams): UseIsFollowingBatchReturn {
    const { pairs } = params;

    const { data, ...rest } = useQuery({
      queryKey: followerKeys.isFollowingBatch(pairs),
      queryFn: () => queryFn(pairs),
      enabled: pairs.length > 0,
    });

    return {
      results: data ?? new Map(),
      ...rest,
    };
  }

  return useIsFollowingBatch;
}
