import { fetchDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseDataChangedEvents } from '../factories';

/**
 * Fetch a paginated list of ERC725Y DataChanged event records with filtering and sorting.
 *
 * Wraps `fetchDataChangedEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, dataKey, dataKeyName, blockNumber, timestamp, universalProfileName,
 * digitalAssetName) and sorting (by timestamp, blockNumber, universalProfileName,
 * digitalAssetName).
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ dataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `dataChangedEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useDataChangedEvents } from '@lsp-indexer/react';
 *
 * function DataChangedEventList({ address }: { address: string }) {
 *   const { dataChangedEvents, totalCount, isLoading } = useDataChangedEvents({
 *     filter: { address, dataKeyName: 'LSP3Profile' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} data changed events</p>
 *       {dataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.dataKey}`}>
 *           {evt.dataKeyName ?? evt.dataKey}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useDataChangedEvents = createUseDataChangedEvents((params) =>
  params.include
    ? fetchDataChangedEvents(getClientUrl(), params)
    : fetchDataChangedEvents(getClientUrl(), params),
);
