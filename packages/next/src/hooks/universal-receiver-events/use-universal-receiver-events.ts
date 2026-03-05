'use client';

import { createUseUniversalReceiverEvents } from '@lsp-indexer/react';
import { getUniversalReceiverEvents } from '../../actions/universal-receiver-events';

/**
 * Fetch a paginated list of universal receiver event records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useUniversalReceiverEvents`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ universalReceiverEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `universalReceiverEvents` and `totalCount`
 */
export const useUniversalReceiverEvents = createUseUniversalReceiverEvents(
  getUniversalReceiverEvents,
);
