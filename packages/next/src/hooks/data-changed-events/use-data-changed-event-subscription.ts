'use client';

import { createUseDataChangedEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Data changed event subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseDataChangedEventSubscription — shared factory in `@lsp-indexer/react`
 */
export const useDataChangedEventSubscription =
  createUseDataChangedEventSubscription(useSubscription);
