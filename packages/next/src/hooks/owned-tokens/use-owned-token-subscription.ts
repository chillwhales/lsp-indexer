'use client';

import { createUseOwnedTokenSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Owned token subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseOwnedTokenSubscription — shared factory in `@lsp-indexer/react`
 */
export const useOwnedTokenSubscription = createUseOwnedTokenSubscription(useSubscription);
