'use client';

import { createIndexerClient, type IndexerClientConfig } from '@lsp-indexer/node';
import { useEffect, useMemo, type ReactNode } from 'react';
import { SubscriptionClientContext } from '../subscriptions/context';
import { IndexerClientContext } from './context';

export interface IndexerProviderProps extends IndexerClientConfig {
  children: ReactNode;
}

/**
 * Provide one shared v3 HTTP/WebSocket client.
 *
 * Requests still carry an explicit network. The client's configured network is exposed through
 * `useIndexerNetwork()` as an ergonomic default for application code, never as hidden request
 * identity.
 */
export function IndexerProvider({
  url,
  network,
  wsUrl,
  children,
}: IndexerProviderProps): ReactNode {
  const client = useMemo(() => createIndexerClient({ url, network, wsUrl }), [network, url, wsUrl]);

  useEffect(() => {
    return () => {
      client.dispose();
    };
  }, [client]);

  return (
    <IndexerClientContext.Provider value={client}>
      <SubscriptionClientContext.Provider value={client.subscriptions}>
        {children}
      </SubscriptionClientContext.Provider>
    </IndexerClientContext.Provider>
  );
}
