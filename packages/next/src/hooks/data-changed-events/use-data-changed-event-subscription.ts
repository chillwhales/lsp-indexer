'use client';

import { createUseDataChangedEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time DataChanged event subscription. Delegates to React hook. */
export const useDataChangedEventSubscription =
  createUseDataChangedEventSubscription(useSubscription);
