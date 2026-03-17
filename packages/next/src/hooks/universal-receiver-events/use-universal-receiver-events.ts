'use client';

import { createUseUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '@lsp-indexer/next/actions';

/** Paginated UniversalReceiver event list via Next.js server action. */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
