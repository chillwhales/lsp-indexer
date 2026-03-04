import { fetchFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteFollows } from '../factories';

/**
 * Fetch follow relationships with infinite scroll pagination.
 *
 * Wraps `fetchFollows` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `follows` array.
 * Uses a **separate query key namespace** from `useFollows` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ follows, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened follows array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteFollows } from '@lsp-indexer/react';
 *
 * function InfiniteFollowerList({ address }: { address: string }) {
 *   const {
 *     follows,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteFollows({
 *     filter: { followedAddress: address },
 *   });
 *
 *   return (
 *     <div>
 *       {follows.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load more'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useInfiniteFollows = createUseInfiniteFollows((params) =>
  fetchFollows(getClientUrl(), params),
);
