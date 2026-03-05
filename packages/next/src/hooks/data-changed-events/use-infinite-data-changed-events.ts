'use client';

import { createUseInfiniteDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '../../actions/data-changed-events';

/**
 * Fetch ERC725Y DataChanged event records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDataChangedEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ dataChangedEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened dataChangedEvents array with infinite scroll controls
 */
export const useInfiniteDataChangedEvents =
  createUseInfiniteDataChangedEvents(getDataChangedEvents);
