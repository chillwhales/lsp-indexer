'use client';

import { createUseLatestDataChangedEvent } from '@lsp-indexer/react';
import { getLatestDataChangedEvent } from '../../actions/data-changed-events';

/**
 * Fetch the most recent ERC725Y DataChanged event matching the given filter via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useLatestDataChangedEvent`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP3Profile') and the service layer resolves it to hex automatically.
 *
 * @param params - Filter and optional include config
 * @returns `{ dataChangedEvent, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `dataChangedEvent`
 */
export const useLatestDataChangedEvent = createUseLatestDataChangedEvent(getLatestDataChangedEvent);
