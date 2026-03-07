import { createUseOwnedTokenSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseOwnedTokenSubscription */
export const useOwnedTokenSubscription = createUseOwnedTokenSubscription(useSubscription);
