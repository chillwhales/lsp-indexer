'use client';

import { createUseProfileSubscription } from '@lsp-indexer/react';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from './use-subscription';

/**
 * Profile subscription hook for `@lsp-indexer/next`.
 *
 * Thin wrapper — calls the shared factory with the Next.js-specific
 * `useSubscription` (bound to the Next.js IndexerSubscriptionProvider
 * context with WebSocket proxy support) and TanStack Query's
 * `useQueryClient` for cache invalidation.
 *
 * @see createUseProfileSubscription — shared factory in `@lsp-indexer/react`
 */
export const useProfileSubscription = createUseProfileSubscription(useSubscription, useQueryClient);
