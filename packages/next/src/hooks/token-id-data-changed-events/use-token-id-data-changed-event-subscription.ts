'use client';

import { createUseTokenIdDataChangedEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time TokenIdDataChanged event subscription. Delegates to React hook. */
export const useTokenIdDataChangedEventSubscription =
  createUseTokenIdDataChangedEventSubscription(useSubscription);
