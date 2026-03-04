import { createUseDigitalAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Digital asset subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseDigitalAssetSubscription — shared factory
 */
export const useDigitalAssetSubscription = createUseDigitalAssetSubscription(useSubscription);
