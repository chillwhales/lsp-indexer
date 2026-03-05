import { fetchLatestTokenIdDataChangedEvent, getClientUrl } from '@lsp-indexer/node';
import { createUseLatestTokenIdDataChangedEvent } from '../factories';

/**
 * Fetch the most recent ERC725Y TokenIdDataChanged event matching the given filter.
 *
 * Wraps `fetchLatestTokenIdDataChangedEvent` in a TanStack `useQuery` hook. Internally
 * sorts by timestamp descending and returns the first result. Useful for getting
 * the current value of a specific ERC725Y data key for a given token ID.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Filter and optional include config
 * @returns `{ tokenIdDataChangedEvent, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `tokenIdDataChangedEvent`
 *
 * @example
 * ```tsx
 * import { useLatestTokenIdDataChangedEvent } from '@lsp-indexer/react';
 *
 * function LatestTokenMetadataChange({ address, tokenId }: { address: string; tokenId: string }) {
 *   const { tokenIdDataChangedEvent, isLoading } = useLatestTokenIdDataChangedEvent({
 *     filter: { address, tokenId, dataKeyName: 'LSP4Metadata' },
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!tokenIdDataChangedEvent) return <p>No data change found</p>;
 *
 *   return <p>Latest value: {tokenIdDataChangedEvent.dataValue}</p>;
 * }
 * ```
 */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent((params) =>
  fetchLatestTokenIdDataChangedEvent(getClientUrl(), params),
);
