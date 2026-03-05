import { fetchIssuedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteIssuedAssets } from '../factories';

/**
 * Fetch LSP12 issued asset records with infinite scroll pagination.
 *
 * Wraps `fetchIssuedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `issuedAssets` array.
 * Uses a **separate query key namespace** from `useIssuedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ issuedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened issuedAssets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteIssuedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteIssuedAssetList({ address }: { address: string }) {
 *   const {
 *     issuedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteIssuedAssets({
 *     filter: { issuerAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {issuedAssets.map((ia) => (
 *         <div key={`${ia.issuerAddress}-${ia.assetAddress}`}>
 *           {ia.assetAddress}
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
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets((params) =>
  fetchIssuedAssets(getClientUrl(), params),
);
