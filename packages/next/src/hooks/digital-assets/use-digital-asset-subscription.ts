'use client';

import { createUseDigitalAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Digital asset subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseDigitalAssetSubscription — shared factory in `@lsp-indexer/react`
 */
export const useDigitalAssetSubscription = createUseDigitalAssetSubscription(useSubscription);
