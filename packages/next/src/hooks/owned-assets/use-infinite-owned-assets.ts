'use client';

import { createUseInfiniteOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '../../actions/owned-assets';

/**
 * Fetch owned assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteOwnedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ ownedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened owned assets array with infinite scroll controls
 */
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets(getOwnedAssets);
