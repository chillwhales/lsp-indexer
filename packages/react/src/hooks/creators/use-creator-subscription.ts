import { createUseCreatorSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Creator subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseCreatorSubscription — shared factory
 */
export const useCreatorSubscription = createUseCreatorSubscription(useSubscription);
