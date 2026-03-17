'use client';

import { getUniversalReceiverEvents } from '@lsp-indexer/next/actions';
import { createUseUniversalReceiverEvents } from '@lsp-indexer/react';

/** Paginated UniversalReceiver event list via Next.js server action. */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
