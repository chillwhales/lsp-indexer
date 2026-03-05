'use client';

import { createUseIssuedAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Issued asset subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support).
 *
 * @see createUseIssuedAssetSubscription — shared factory in `@lsp-indexer/react`
 */
export const useIssuedAssetSubscription = createUseIssuedAssetSubscription(useSubscription);
