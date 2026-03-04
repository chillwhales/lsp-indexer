'use client';

import { createUseNftSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * NFT subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseNftSubscription — shared factory in `@lsp-indexer/react`
 */
export const useNftSubscription = createUseNftSubscription(useSubscription);
