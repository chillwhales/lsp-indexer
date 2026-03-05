import { createUseEncryptedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Encrypted asset subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseEncryptedAssetSubscription — shared factory
 */
export const useEncryptedAssetSubscription = createUseEncryptedAssetSubscription(useSubscription);
