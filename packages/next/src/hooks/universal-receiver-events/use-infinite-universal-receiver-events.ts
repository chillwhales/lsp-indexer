'use client';

import { createUseInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '../../actions/universal-receiver-events';

/** Infinite scroll UniversalReceiver events via Next.js server action. */
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
