import { createUseUniversalReceiverEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Universal receiver event subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseUniversalReceiverEventSubscription — shared factory
 */
export const useUniversalReceiverEventSubscription =
  createUseUniversalReceiverEventSubscription(useSubscription);
