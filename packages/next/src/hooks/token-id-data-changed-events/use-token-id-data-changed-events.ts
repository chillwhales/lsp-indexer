'use client';

import { getTokenIdDataChangedEvents } from '@lsp-indexer/next/actions';
import { createUseTokenIdDataChangedEvents } from '@lsp-indexer/react';

/** Paginated TokenIdDataChanged event list via Next.js server action. */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
