/**
 * Factory for useFollowCount — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseFollowCount(queryFn)` with its own fetch function:
 * - React: `(address) => fetchFollowCount(getClientUrl(), { address })`
 * - Next:  `(address) => getFollowCount(address)`
 *
 * Custom factory (no generic equivalent) because the return shape
 * `{ followerCount, followingCount }` is unique to the followers domain.
 */
import { followerKeys } from '@lsp-indexer/node';
import type { FollowCount, UseFollowCountParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseFollowCountReturn } from '../../types';

/**
 * Create a `useFollowCount` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for follow counts
 */
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
