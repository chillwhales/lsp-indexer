'use client';

import { createUseCreatorSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Creator subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseCreatorSubscription — shared factory in `@lsp-indexer/react`
 */
export const useCreatorSubscription = createUseCreatorSubscription(useSubscription);
