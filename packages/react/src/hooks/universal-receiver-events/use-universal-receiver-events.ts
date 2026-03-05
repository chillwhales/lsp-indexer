import { fetchUniversalReceiverEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseUniversalReceiverEvents } from '../factories';

/**
 * Fetch a paginated list of universal receiver event records with filtering and sorting.
 *
 * Wraps `fetchUniversalReceiverEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, from, typeId, timestamp, blockNumber, universalProfileName,
 * fromProfileName, fromAssetName) and sorting (by timestamp, blockNumber,
 * universalProfileName, fromProfileName, fromAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ universalReceiverEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `universalReceiverEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useUniversalReceiverEvents } from '@lsp-indexer/react';
 *
 * function UniversalReceiverEventList({ address }: { address: string }) {
 *   const { universalReceiverEvents, totalCount, isLoading } = useUniversalReceiverEvents({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} universal receiver events</p>
 *       {universalReceiverEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.from}-${evt.typeId}`}>
 *           {evt.typeId}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents((params) =>
  fetchUniversalReceiverEvents(getClientUrl(), params),
);
