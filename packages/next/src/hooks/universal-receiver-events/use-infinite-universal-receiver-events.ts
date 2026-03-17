'use client';

import { createUseInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '@lsp-indexer/next/actions';

/** Infinite scroll UniversalReceiver events via Next.js server action. */
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
