'use client';

import { createUseInfiniteUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '../../actions/universal-receiver-events';

/**
 * Fetch universal receiver event records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteUniversalReceiverEvents`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ universalReceiverEvents, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened universalReceiverEvents array with infinite scroll controls
 */
export const useInfiniteUniversalReceiverEvents = createUseInfiniteUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
