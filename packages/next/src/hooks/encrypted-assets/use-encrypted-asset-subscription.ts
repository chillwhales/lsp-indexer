'use client';

import { createUseEncryptedAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Encrypted asset subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseEncryptedAssetSubscription — shared factory in `@lsp-indexer/react`
 */
export const useEncryptedAssetSubscription = createUseEncryptedAssetSubscription(useSubscription);
