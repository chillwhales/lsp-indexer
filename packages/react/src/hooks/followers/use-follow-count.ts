import { fetchFollowCount, getClientUrl } from '@lsp-indexer/node';
import { createUseFollowCount } from '../factories';

/**
 * Fetch follower and following counts for an address.
 *
 * Wraps `fetchFollowCount` in a TanStack `useQuery` hook. Returns two numbers:
 * - `followerCount` — how many profiles follow this address
 * - `followingCount` — how many profiles this address follows
 *
 * The query is disabled when `address` is falsy.
 *
 * @param params - Address whose follow counts to fetch
 * @returns `{ followerCount, followingCount, isLoading, error, ...rest }` — follow counts
 *   with full TanStack Query state
 *
 * @example
 * ```tsx
 * import { useFollowCount } from '@lsp-indexer/react';
 *
 * function FollowStats({ address }: { address: string }) {
 *   const { followerCount, followingCount, isLoading } = useFollowCount({ address });
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <span>{followerCount} followers</span>
 *       <span>{followingCount} following</span>
 *     </div>
 *   );
 * }
 * ```
 */
export const useFollowCount = createUseFollowCount((address) =>
  fetchFollowCount(getClientUrl(), { address }),
);
