import { fetchIsFollowing, getClientUrl } from '@lsp-indexer/node';
import { createUseIsFollowing } from '../factories';

/**
 * Check if one address follows another.
 *
 * Wraps `fetchIsFollowing` in a TanStack `useQuery` hook. Returns a boolean
 * indicating whether `followerAddress` follows `followedAddress`.
 *
 * The query is disabled when either address is falsy.
 *
 * @param params - Two addresses to check the follow relationship between
 * @returns `{ isFollowing, isLoading, error, ...rest }` — boolean result
 *   with full TanStack Query state
 *
 * @example
 * ```tsx
 * import { useIsFollowing } from '@lsp-indexer/react';
 *
 * function FollowButton({ viewer, profile }: { viewer: string; profile: string }) {
 *   const { isFollowing, isLoading } = useIsFollowing({
 *     followerAddress: viewer,
 *     followedAddress: profile,
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <button>{isFollowing ? 'Unfollow' : 'Follow'}</button>
 *   );
 * }
 * ```
 */
export const useIsFollowing = createUseIsFollowing((followerAddress, followedAddress) =>
  fetchIsFollowing(getClientUrl(), { followerAddress, followedAddress }),
);
