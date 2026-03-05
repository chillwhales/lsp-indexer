import { fetchEncryptedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteEncryptedAssets } from '../factories';

/**
 * Fetch LSP29 encrypted asset records with infinite scroll pagination.
 *
 * Wraps `fetchEncryptedAssets` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `encryptedAssets` array.
 * Uses a **separate query key namespace** from `useEncryptedAssets` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ encryptedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened encryptedAssets array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteEncryptedAssets } from '@lsp-indexer/react';
 *
 * function InfiniteEncryptedAssetList({ address }: { address: string }) {
 *   const {
 *     encryptedAssets,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteEncryptedAssets({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {encryptedAssets.map((ea) => (
 *         <div key={`${ea.address}-${ea.contentId}-${ea.revision}`}>
 *           {ea.address}
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
export const useInfiniteEncryptedAssets = createUseInfiniteEncryptedAssets((params) =>
  fetchEncryptedAssets(getClientUrl(), params),
);
