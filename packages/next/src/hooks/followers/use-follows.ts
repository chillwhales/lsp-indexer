'use client';

import { createUseFollows } from '@lsp-indexer/react';
import { getFollows } from '../../actions/followers';

/**
 * Fetch a paginated list of follow relationships via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useFollows`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ follows, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `follows` and `totalCount`
 */
export const useFollows = createUseFollows(getFollows);
