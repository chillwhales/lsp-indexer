import { fetchOwnedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteOwnedAssets } from '../factories';

/**
 * Fetch owned assets with infinite scroll pagination.
 *
 * Wraps `fetchOwnedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `ownedAssets` array.
 * Uses a **separate query key namespace** from `useOwnedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteOwnedAssetList({ owner }: { owner: string }) {
 *   const {
 *     ownedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedAssets({
 *     filter: { owner },
 *     sort: { field: 'balance', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedAssets.map((a) => (
 *         <div key={a.id}>{a.address} — {a.balance.toString()}</div>
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
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets((params) =>
  fetchOwnedAssets(getClientUrl(), params),
);
