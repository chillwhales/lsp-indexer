'use client';

import { createUseTokenIdDataChangedEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Token ID data changed event subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseTokenIdDataChangedEventSubscription — shared factory in `@lsp-indexer/react`
 */
export const useTokenIdDataChangedEventSubscription =
  createUseTokenIdDataChangedEventSubscription(useSubscription);
