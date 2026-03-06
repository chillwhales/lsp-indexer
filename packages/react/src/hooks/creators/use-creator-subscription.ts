import { createUseCreatorSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseCreatorSubscription */
export const useCreatorSubscription = createUseCreatorSubscription(useSubscription);
