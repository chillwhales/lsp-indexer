import { createUseDataChangedEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Data changed event subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseDataChangedEventSubscription — shared factory
 */
export const useDataChangedEventSubscription =
  createUseDataChangedEventSubscription(useSubscription);
