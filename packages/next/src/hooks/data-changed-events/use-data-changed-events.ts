'use client';

import { createUseDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '@lsp-indexer/next/actions';

/** Paginated DataChanged event list via Next.js server action. */
export const useDataChangedEvents = createUseDataChangedEvents(getDataChangedEvents);
