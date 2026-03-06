import { createUseNftSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseNftSubscription */
export const useNftSubscription = createUseNftSubscription(useSubscription);
