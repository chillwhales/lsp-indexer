'use client';

import { createUseUniversalReceiverEventSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time UniversalReceiver event subscription. Delegates to React hook. */
export const useUniversalReceiverEventSubscription =
  createUseUniversalReceiverEventSubscription(useSubscription);
