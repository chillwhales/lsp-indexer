'use client';

import { createUseUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '../../actions/universal-receiver-events';

/** Paginated UniversalReceiver event list via Next.js server action. */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
