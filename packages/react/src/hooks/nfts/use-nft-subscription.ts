import { createUseNftSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * NFT subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseNftSubscription — shared factory
 */
export const useNftSubscription = createUseNftSubscription(useSubscription);
