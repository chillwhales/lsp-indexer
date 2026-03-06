import { createUseProfileSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseProfileSubscription */
export const useProfileSubscription = createUseProfileSubscription(useSubscription);
