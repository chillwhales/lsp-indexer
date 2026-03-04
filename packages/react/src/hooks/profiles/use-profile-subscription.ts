import { createUseProfileSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Profile subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseProfileSubscription — shared factory
 */
export const useProfileSubscription = createUseProfileSubscription(useSubscription);
