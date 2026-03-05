import { createUseIssuedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/**
 * Issued asset subscription hook for `@lsp-indexer/react`.
 *
 * Thin wrapper — calls the shared factory with the React-specific
 * `useSubscription` (bound to IndexerSubscriptionProvider context).
 *
 * @see createUseIssuedAssetSubscription — shared factory
 */
export const useIssuedAssetSubscription = createUseIssuedAssetSubscription(useSubscription);
