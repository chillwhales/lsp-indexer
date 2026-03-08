'use client';

import { createUseTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '../../actions/token-id-data-changed-events';

/** Paginated TokenIdDataChanged event list via Next.js server action. */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
