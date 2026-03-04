import { fetchOwnedTokens, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteOwnedTokens } from '../factories';

/**
 * Fetch owned tokens with infinite scroll pagination.
 *
 * Wraps `fetchOwnedTokens` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `ownedTokens` array.
 * Uses a **separate query key namespace** from `useOwnedTokens` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedTokens, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned tokens array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteOwnedTokens } from '@lsp-indexer/react';
 *
 * function InfiniteOwnedTokenList({ holderAddress }: { holderAddress: string }) {
 *   const {
 *     ownedTokens,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteOwnedTokens({
 *     filter: { holderAddress },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {ownedTokens.map((t) => (
 *         <div key={t.id}>{t.digitalAssetAddress} — {t.tokenId}</div>
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
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens((params) =>
  fetchOwnedTokens(getClientUrl(), params),
);
