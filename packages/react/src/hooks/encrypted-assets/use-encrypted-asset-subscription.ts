import { createUseEncryptedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseEncryptedAssetSubscription */
export const useEncryptedAssetSubscription = createUseEncryptedAssetSubscription(useSubscription);
