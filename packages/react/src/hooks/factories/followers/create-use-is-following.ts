/**
 * Factory for useIsFollowing — shared between `@lsp-indexer/react` and `@lsp-indexer/next`.
 *
 * Each package calls `createUseIsFollowing(queryFn)` with its own fetch function:
 * - React: `(follower, followed) => fetchIsFollowing(getClientUrl(), { followerAddress, followedAddress })`
 * - Next:  `(follower, followed) => getIsFollowing(follower, followed)`
 *
 * Custom factory (no generic equivalent) because the return shape
 * `{ isFollowing: boolean }` is unique to the followers domain.
 */
import { followerKeys } from '@lsp-indexer/node';
import type { UseIsFollowingParams } from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseIsFollowingReturn } from '../../types';

/**
 * Create a `useIsFollowing` hook bound to a specific fetch function.
 *
 * @param queryFn - Package-specific fetch function for follow check
 */
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
