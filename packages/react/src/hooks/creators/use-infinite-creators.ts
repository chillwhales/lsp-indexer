import { fetchCreators, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteCreators } from '../factories';

/**
 * Fetch LSP4 creator records with infinite scroll pagination.
 *
 * Wraps `fetchCreators` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `creators` array.
 * Uses a **separate query key namespace** from `useCreators` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteCreators } from '@lsp-indexer/react';
 *
 * function InfiniteCreatorList() {
 *   const {
 *     creators,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteCreators({
 *     filter: { creatorAddress: '0x...' },
 *   });
 *
 *   return (
 *     <div>
 *       {creators.map((c) => (
 *         <div key={`${c.creatorAddress}-${c.digitalAssetAddress}`}>
 *           {c.creatorAddress}
 *         </div>
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
export const useInfiniteCreators = createUseInfiniteCreators((params) =>
  fetchCreators(getClientUrl(), params),
);
