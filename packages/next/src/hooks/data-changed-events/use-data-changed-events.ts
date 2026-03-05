'use client';

import { createUseDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '../../actions/data-changed-events';

/**
 * Fetch a paginated list of ERC725Y DataChanged event records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDataChangedEvents`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ dataChangedEvents, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `dataChangedEvents` and `totalCount`
 */
export const useDataChangedEvents = createUseDataChangedEvents(getDataChangedEvents);
