import { createUseUniversalReceiverEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseUniversalReceiverEventSubscription */
export const useUniversalReceiverEventSubscription =
  createUseUniversalReceiverEventSubscription(useSubscription);
