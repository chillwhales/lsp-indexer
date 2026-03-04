'use client';

import { createUseInfiniteNfts } from '@lsp-indexer/react';
import { getNfts } from '../../actions/nfts';

/**
 * Fetch NFTs with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteNfts`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ nfts, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened NFTs array with infinite scroll controls
 */
export const useInfiniteNfts = createUseInfiniteNfts(getNfts);
