import { fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteDataChangedEvents } from '../factories';

/**
 * Fetch ERC725Y DataChanged event records with infinite scroll pagination.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `dataChangedEvents` array.
 * Uses a **separate query key namespace** from `useDataChangedEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ dataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened dataChangedEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteDataChangedEvents } from '@lsp-indexer/react';
 *
 * function InfiniteDataChangedEventList({ address }: { address: string }) {
 *   const {
 *     dataChangedEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteDataChangedEvents({
 *     filter: { address, dataKeyName: 'LSP3Profile' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {dataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.dataKey}`}>
 *           {evt.dataKeyName ?? evt.dataKey}
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
export const useInfiniteDataChangedEvents = createUseInfiniteDataChangedEvents((params) =>
  params.include
    ? fetchDataChangedEvents(getClientUrl(), params)
    : fetchDataChangedEvents(getClientUrl(), params),
);
