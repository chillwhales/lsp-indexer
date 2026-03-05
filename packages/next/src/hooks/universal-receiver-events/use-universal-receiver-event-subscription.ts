'use client';

import { createUseUniversalReceiverEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/**
 * Universal receiver event subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * which routes through server actions).
 *
 * @see createUseUniversalReceiverEventSubscription — shared factory in `@lsp-indexer/react`
 */
export const useUniversalReceiverEventSubscription =
  createUseUniversalReceiverEventSubscription(useSubscription);
