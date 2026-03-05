'use client';

import { createUseTokenIdDataChangedEvents } from '@lsp-indexer/react';
import { getTokenIdDataChangedEvents } from '../../actions/token-id-data-changed-events';

/**
 * Fetch a paginated list of ERC725Y TokenIdDataChanged event records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useTokenIdDataChangedEvents`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ tokenIdDataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `tokenIdDataChangedEvents` and `totalCount`
 */
export const useTokenIdDataChangedEvents = createUseTokenIdDataChangedEvents(
  getTokenIdDataChangedEvents,
);
