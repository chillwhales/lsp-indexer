import type { IndexerClient } from '@lsp-indexer/node';
import { createContext, useContext } from 'react';

const IndexerClientContext = createContext<IndexerClient | null>(null);
IndexerClientContext.displayName = 'IndexerClientContext';

/** React context for the optional shared v3 Node client. */
export { IndexerClientContext };

/** Return the shared v3 client when an `IndexerProvider` is present. */
export function useOptionalIndexerClient(): IndexerClient | null {
  return useContext(IndexerClientContext);
}

/** Return the shared v3 client or throw when the provider is missing. */
export function useIndexerClient(): IndexerClient {
  const client = useOptionalIndexerClient();
  if (!client) {
    throw new Error(
      'useIndexerClient must be used within an <IndexerProvider>. ' +
        'Wrap your component tree with <IndexerProvider> or use explicit hook parameters.',
    );
  }
  return client;
}

/** Return the provider client's configured default network. */
export function useIndexerNetwork(): string {
  return useIndexerClient().network;
}
