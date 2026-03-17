'use client';

import { getLatestTokenIdDataChangedEvent } from '@lsp-indexer/next/actions';
import { createUseLatestTokenIdDataChangedEvent } from '@lsp-indexer/react';

/** Fetch the most recent TokenIdDataChanged event matching a filter via server action. */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent(
  getLatestTokenIdDataChangedEvent,
);
