'use client';

import { createUseInfiniteTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '../../actions/token-id-data-changed-events';

/**
 * Fetch ERC725Y TokenIdDataChanged event records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteTokenIdDataChangedEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ tokenIdDataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened tokenIdDataChangedEvents array with infinite scroll controls
 */
export const useInfiniteTokenIdDataChangedEvents = createUseInfiniteTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
