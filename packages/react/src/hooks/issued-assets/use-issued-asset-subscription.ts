import { createUseIssuedAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseIssuedAssetSubscription */
export const useIssuedAssetSubscription = createUseIssuedAssetSubscription(useSubscription);
