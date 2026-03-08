'use client';

import { createUseInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '../../actions/token-id-data-changed-events';

/** Infinite scroll TokenIdDataChanged events via Next.js server action. */
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
