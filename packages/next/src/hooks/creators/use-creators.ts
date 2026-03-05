'use client';

import { createUseCreators } from '@lsp-indexer/react';
import { getCreators } from '../../actions/creators';

/**
 * Fetch a paginated list of LSP4 creator records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useCreators`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 */
export const useCreators = createUseCreators(getCreators);
