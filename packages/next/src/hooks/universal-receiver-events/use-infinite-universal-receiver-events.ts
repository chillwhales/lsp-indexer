'use client';

import { getUniversalReceiverEvents } from '@lsp-indexer/next/actions';
import { createUseInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';

/** Infinite scroll UniversalReceiver events via Next.js server action. */
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
