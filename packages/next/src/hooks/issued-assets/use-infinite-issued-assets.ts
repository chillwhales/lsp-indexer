'use client';

import { createUseInfiniteIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '../../actions/issued-assets';

/**
 * Fetch LSP12 issued asset records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteIssuedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ issuedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened issuedAssets array with infinite scroll controls
 */
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets(getIssuedAssets);
