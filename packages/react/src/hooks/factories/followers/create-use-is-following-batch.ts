import { followerKeys } from '@lsp-indexer/node';
import type { UseIsFollowingBatchParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseIsFollowingBatchReturn } from '../../types';

/** Stable empty Map reference to avoid re-renders when query is disabled/loading. */
const EMPTY_RESULTS: Map<string, boolean> = new Map();

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
      results: data ?? EMPTY_RESULTS,
      ...rest,
    };
  }

  return useIsFollowingBatch;
}
