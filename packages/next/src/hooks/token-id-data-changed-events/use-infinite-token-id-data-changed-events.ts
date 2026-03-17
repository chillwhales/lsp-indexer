'use client';

import { getTokenIdDataChangedEvents } from '@lsp-indexer/next/actions';
import { createUseInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';

/** Infinite scroll TokenIdDataChanged events via Next.js server action. */
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
