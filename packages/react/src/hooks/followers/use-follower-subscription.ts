import { createUseFollowerSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Follower subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseFollowerSubscription — shared factory
 */
export const useFollowerSubscription = createUseFollowerSubscription(useSubscription);
