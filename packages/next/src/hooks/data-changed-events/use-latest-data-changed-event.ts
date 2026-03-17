'use client';

import { getLatestDataChangedEvent } from '@lsp-indexer/next/actions';
import { createUseLatestDataChangedEvent } from '@lsp-indexer/react';

/** Fetch the most recent DataChanged event matching a filter via server action. */
export const useLatestDataChangedEvent = createUseLatestDataChangedEvent(getLatestDataChangedEvent);
