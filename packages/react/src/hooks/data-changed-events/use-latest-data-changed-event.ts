import { fetchLatestDataChangedEvent, getClientUrl } from '@lsp-indexer/node';
import { createUseLatestDataChangedEvent } from '../factories';

/**
 * Fetch the most recent ERC725Y DataChanged event matching the given filter.
 *
 * Wraps `fetchLatestDataChangedEvent` in a TanStack `useQuery` hook. Internally
 * sorts by timestamp descending and returns the first result. Useful for getting
 * the current value of a specific ERC725Y data key for a given address.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Filter and optional include config
 * @returns `{ dataChangedEvent, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `dataChangedEvent`
 *
 * @example
 * ```tsx
 * import { useLatestDataChangedEvent } from '@lsp-indexer/react';
 *
 * function LatestProfileChange({ address }: { address: string }) {
 *   const { dataChangedEvent, isLoading } = useLatestDataChangedEvent({
 *     filter: { address, dataKeyName: 'LSP3Profile' },
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!dataChangedEvent) return <p>No data change found</p>;
 *
 *   return <p>Latest value: {dataChangedEvent.dataValue}</p>;
 * }
 * ```
 */
export const useLatestDataChangedEvent = createUseLatestDataChangedEvent((params) =>
  params.include
    ? fetchLatestDataChangedEvent(getClientUrl(), {
        filter: params.filter,
        include: params.include,
      })
    : fetchLatestDataChangedEvent(getClientUrl(), { filter: params.filter }),
);
