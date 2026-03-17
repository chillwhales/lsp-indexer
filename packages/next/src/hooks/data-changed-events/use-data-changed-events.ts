'use client';

import { getDataChangedEvents } from '@lsp-indexer/next/actions';
import { createUseDataChangedEvents } from '@lsp-indexer/react';

/** Paginated DataChanged event list via Next.js server action. */
export const useDataChangedEvents = createUseDataChangedEvents(getDataChangedEvents);
