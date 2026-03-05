import { fetchTokenIdDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteTokenIdDataChangedEvents } from '../factories';

/**
 * Fetch ERC725Y TokenIdDataChanged event records with infinite scroll pagination.
 *
 * Wraps `fetchTokenIdDataChangedEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `tokenIdDataChangedEvents` array.
 * Uses a **separate query key namespace** from `useTokenIdDataChangedEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ tokenIdDataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened tokenIdDataChangedEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';
 *
 * function InfiniteTokenIdDataChangedEventList({ address }: { address: string }) {
 *   const {
 *     tokenIdDataChangedEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteTokenIdDataChangedEvents({
 *     filter: { address, dataKeyName: 'LSP4Metadata' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {tokenIdDataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.tokenId}-${evt.dataKey}`}>
 *           {evt.tokenId}: {evt.dataKeyName ?? evt.dataKey}
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
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  (params) => fetchTokenIdDataChangedEvents(getClientUrl(), params),
);
