'use client';

import { createUseFollowerSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Follower subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseFollowerSubscription — shared factory in `@lsp-indexer/react`
 */
export const useFollowerSubscription = createUseFollowerSubscription(useSubscription);
