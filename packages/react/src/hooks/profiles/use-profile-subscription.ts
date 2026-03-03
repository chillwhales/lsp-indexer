import { useQueryClient } from '@tanstack/react-query';
import { createUseProfileSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Profile subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context)
 * and TanStack Query's `useQueryClient` for cache invalidation.
 *
 * @see createUseProfileSubscription — shared factory
 */
export const useProfileSubscription = createUseProfileSubscription(useSubscription, useQueryClient);
