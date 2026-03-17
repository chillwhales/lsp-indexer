'use client';

import { createUseLatestTokenIdDataChangedEvent } from '@lsp-indexer/react';
import { getLatestTokenIdDataChangedEvent } from '@lsp-indexer/next/actions';

/** Fetch the most recent TokenIdDataChanged event matching a filter via server action. */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent(
  getLatestTokenIdDataChangedEvent,
);
