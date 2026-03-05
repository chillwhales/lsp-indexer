import { createUseTokenIdDataChangedEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Token ID data changed event subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseTokenIdDataChangedEventSubscription — shared factory
 */
export const useTokenIdDataChangedEventSubscription =
  createUseTokenIdDataChangedEventSubscription(useSubscription);
