import { fetchNfts, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteNfts } from '../factories';

/**
 * Fetch NFTs with infinite scroll pagination.
 *
 * Wraps `fetchNfts` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `nfts` array.
 * Uses a **separate query key namespace** from `useNfts` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ nfts, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened NFTs array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteNfts } from '@lsp-indexer/react';
 *
 * function InfiniteNftList() {
 *   const {
 *     nfts,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteNfts({
 *     filter: { collectionAddress: '0x86E8...' },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {nfts.map((n) => (
 *         <div key={`${n.address}-${n.tokenId}`}>{n.name ?? n.tokenId}</div>
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
export const useInfiniteNfts = createUseInfiniteNfts((params) =>
  params.include ? fetchNfts(getClientUrl(), params) : fetchNfts(getClientUrl(), params),
);
