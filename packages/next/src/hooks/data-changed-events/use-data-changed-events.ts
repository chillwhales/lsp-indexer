'use client';

import { createUseDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '../../actions/data-changed-events';

/** Paginated DataChanged event list via Next.js server action. */
export const useDataChangedEvents = createUseDataChangedEvents(getDataChangedEvents);
