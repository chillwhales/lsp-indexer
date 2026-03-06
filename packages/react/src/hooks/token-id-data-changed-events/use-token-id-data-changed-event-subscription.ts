import { createUseTokenIdDataChangedEventSubscription } from '../factories';
import { useSubscription } from '../use-subscription';

/** @see createUseTokenIdDataChangedEventSubscription */
export const useTokenIdDataChangedEventSubscription =
  createUseTokenIdDataChangedEventSubscription(useSubscription);
