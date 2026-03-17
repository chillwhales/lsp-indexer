'use client';

import { createUseTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '@lsp-indexer/next/actions';

/** Paginated TokenIdDataChanged event list via Next.js server action. */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
