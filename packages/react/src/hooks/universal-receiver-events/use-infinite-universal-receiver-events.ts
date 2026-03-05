import { fetchUniversalReceiverEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseInfiniteUniversalReceiverEvents } from '../factories';

/**
 * Fetch universal receiver event records with infinite scroll pagination.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `universalReceiverEvents` array.
 * Uses a **separate query key namespace** from `useUniversalReceiverEvents` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ universalReceiverEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened universalReceiverEvents array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function InfiniteUniversalReceiverEventList({ address }: { address: string }) {
 *   const {
 *     universalReceiverEvents,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *   } = useInfiniteUniversalReceiverEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {universalReceiverEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.from}-${evt.typeId}`}>
 *           {evt.typeId}
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
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  (params) => fetchUniversalReceiverEvents(getClientUrl(), params),
);
