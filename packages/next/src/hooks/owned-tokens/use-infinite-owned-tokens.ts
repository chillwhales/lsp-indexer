'use client';

import { createUseInfiniteOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '../../actions/owned-tokens';

/**
 * Fetch owned tokens with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedTokens`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedTokens, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned tokens array with infinite scroll controls
 */
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens(getOwnedTokens);
