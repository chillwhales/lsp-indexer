import type { SubscriptionClient } from '@lsp-indexer/node';
import { createContext, useContext } from 'react';

const SubscriptionClientContext = createContext<SubscriptionClient | null>(null);
SubscriptionClientContext.displayName = 'SubscriptionClientContext';

/** React context holding the SubscriptionClient instance for subscription hooks. */
export { SubscriptionClientContext };

/**
 * Get the SubscriptionClient from context.
 * Throws a helpful error if used outside IndexerSubscriptionProvider.
 */
export function useSubscriptionClient(): SubscriptionClient {
  const client = useContext(SubscriptionClientContext);
  if (!client) {
    throw new Error(
      'useSubscriptionClient must be used within an <IndexerSubscriptionProvider>. ' +
        'Wrap your component tree with <IndexerSubscriptionProvider> to use subscription hooks.',
    );
  }
  return client;
}
