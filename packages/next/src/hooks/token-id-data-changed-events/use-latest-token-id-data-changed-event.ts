'use client';

import { createUseLatestTokenIdDataChangedEvent } from '@lsp-indexer/react';
import { getLatestTokenIdDataChangedEvent } from '../../actions/token-id-data-changed-events';

/** Fetch the most recent TokenIdDataChanged event matching a filter via server action. */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent(
  getLatestTokenIdDataChangedEvent,
);
