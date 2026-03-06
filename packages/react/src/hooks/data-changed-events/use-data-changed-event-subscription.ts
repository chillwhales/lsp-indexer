import { createUseDataChangedEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseDataChangedEventSubscription */
export const useDataChangedEventSubscription =
  createUseDataChangedEventSubscription(useSubscription);
