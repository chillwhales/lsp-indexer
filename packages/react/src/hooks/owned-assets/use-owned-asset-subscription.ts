import { createUseOwnedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Owned asset subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseOwnedAssetSubscription — shared factory
 */
export const useOwnedAssetSubscription = createUseOwnedAssetSubscription(useSubscription);
