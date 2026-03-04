'use client';

import { createUseProfileSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Profile subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseProfileSubscription — shared factory in `@lsp-indexer/react`
 */
export const useProfileSubscription = createUseProfileSubscription(useSubscription);
