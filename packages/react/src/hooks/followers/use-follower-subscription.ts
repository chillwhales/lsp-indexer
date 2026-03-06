import { createUseFollowerSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseFollowerSubscription */
export const useFollowerSubscription = createUseFollowerSubscription(useSubscription);
