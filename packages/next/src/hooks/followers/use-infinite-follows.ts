'use client';

import { createUseInfiniteFollows } from '@lsp-indexer/react';
import { getFollows } from '../../actions/followers';

/**
 * Fetch follow relationships with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteFollows`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ follows, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened follows array with infinite scroll controls
 */
export const useInfiniteFollows = createUseInfiniteFollows(getFollows);
