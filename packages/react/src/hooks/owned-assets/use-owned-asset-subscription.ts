import { createUseOwnedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseOwnedAssetSubscription */
export const useOwnedAssetSubscription = createUseOwnedAssetSubscription(useSubscription);
