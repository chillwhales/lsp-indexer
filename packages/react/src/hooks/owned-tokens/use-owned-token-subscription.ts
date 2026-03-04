import { createUseOwnedTokenSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Owned token subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseOwnedTokenSubscription — shared factory
 */
export const useOwnedTokenSubscription = createUseOwnedTokenSubscription(useSubscription);
