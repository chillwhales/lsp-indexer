'use client';

import { createUseInfiniteDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '../../actions/digital-assets';

/**
 * Fetch digital assets with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteDigitalAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ digitalAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened digital assets array with infinite scroll controls
 */
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets(getDigitalAssets);
