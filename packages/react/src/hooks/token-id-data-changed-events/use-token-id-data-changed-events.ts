import { fetchTokenIdDataChangedEvents, getClientUrl } from '@lsp-indexer/node';
import { createUseTokenIdDataChangedEvents } from '../factories';

/**
 * Fetch a paginated list of ERC725Y TokenIdDataChanged event records with filtering and sorting.
 *
 * Wraps `fetchTokenIdDataChangedEvents` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, dataKey, dataKeyName, tokenId, blockNumber, timestamp, digitalAssetName,
 * nftName) and sorting (by timestamp, blockNumber, digitalAssetName, nftName).
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ tokenIdDataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `tokenIdDataChangedEvents` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useTokenIdDataChangedEvents } from '@lsp-indexer/react';
 *
 * function TokenIdDataChangedEventList({ address }: { address: string }) {
 *   const { tokenIdDataChangedEvents, totalCount, isLoading } = useTokenIdDataChangedEvents({
 *     filter: { address, dataKeyName: 'LSP4Metadata' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} token ID data changed events</p>
 *       {tokenIdDataChangedEvents.map((evt) => (
 *         <div key={`${evt.address}-${evt.tokenId}-${evt.dataKey}`}>
 *           {evt.tokenId}: {evt.dataKeyName ?? evt.dataKey}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents((params) =>
  fetchTokenIdDataChangedEvents(getClientUrl(), params),
);
