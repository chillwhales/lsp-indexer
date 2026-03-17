'use client';

import { createUseLatestDataChangedEvent } from '@lsp-indexer/react';
import { getLatestDataChangedEvent } from '@lsp-indexer/next/actions';

/** Fetch the most recent DataChanged event matching a filter via server action. */
export const useLatestDataChangedEvent = createUseLatestDataChangedEvent(getLatestDataChangedEvent);
