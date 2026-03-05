'use client';

import { createUseLatestTokenIdDataChangedEvent } from '@lsp-indexer/react';
import { getLatestTokenIdDataChangedEvent } from '../../actions/token-id-data-changed-events';

/**
 * Fetch the most recent ERC725Y TokenIdDataChanged event matching the given filter via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useLatestTokenIdDataChangedEvent`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * Supports `dataKeyName` in the filter — pass a human-readable ERC725Y key name
 * (e.g., 'LSP4Metadata') and the service layer resolves it to hex automatically.
 *
 * @param params - Filter and optional include config
 * @returns `{ tokenIdDataChangedEvent, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `tokenIdDataChangedEvent`
 */
export const useLatestTokenIdDataChangedEvent = createUseLatestTokenIdDataChangedEvent(
  getLatestTokenIdDataChangedEvent,
);
