import { fetchDigitalAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteDigitalAssets } from '../factories';

/**
 * Fetch digital assets with infinite scroll pagination.
 *
 * Wraps `fetchDigitalAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `digitalAssets` array.
 * Uses a **separate query key namespace** from `useDigitalAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened digital assets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDigitalAssets } from '@lsp-indexer/react';
 *
 * function InfiniteAssetList() {
 *   const {
 *     digitalAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteDigitalAssets({
 *     filter: { tokenType: 'NFT' },
 *     sort: { field: 'holderCount', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {digitalAssets.map((a) => (
 *         <div key={a.address}>{a.name}</div>
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
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets((params) =>
  fetchDigitalAssets(getClientUrl(), params),
);
