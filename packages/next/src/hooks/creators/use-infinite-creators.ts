'use client';

import { createUseInfiniteCreators } from '@lsp-indexer/react';
import { getCreators } from '../../actions/creators';

/**
 * Fetch LSP4 creator records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteCreators`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ creators, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened creators array with infinite scroll controls
 */
export const useInfiniteCreators = createUseInfiniteCreators(getCreators);
