'use client';

import { createUseOwnedToken } from '@lsp-indexer/react';
import { getOwnedToken } from '../../actions/owned-tokens';

/**
 * Fetch a single owned token by unique ID via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedToken`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Owned token ID and optional include config
 * @returns `{ ownedToken, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedToken`
 */
export const useOwnedToken = createUseOwnedToken(getOwnedToken);
