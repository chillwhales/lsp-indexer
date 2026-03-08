import { createUseDigitalAssetSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseDigitalAssetSubscription */
export const useDigitalAssetSubscription = createUseDigitalAssetSubscription(useSubscription);
