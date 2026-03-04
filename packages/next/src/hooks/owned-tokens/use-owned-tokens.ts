'use client';

import { createUseOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '../../actions/owned-tokens';

/**
 * Fetch a paginated list of owned tokens via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedTokens`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedTokens, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedTokens` and `totalCount`
 */
export const useOwnedTokens = createUseOwnedTokens(getOwnedTokens);
