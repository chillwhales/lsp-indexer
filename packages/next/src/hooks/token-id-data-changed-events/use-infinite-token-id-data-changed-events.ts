'use client';

import { createUseInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '@lsp-indexer/next/actions';

/** Infinite scroll TokenIdDataChanged events via Next.js server action. */
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
