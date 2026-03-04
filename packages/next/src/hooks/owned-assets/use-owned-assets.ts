'use client';

import { createUseOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '../../actions/owned-assets';

/**
 * Fetch a paginated list of owned assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedAssets` and `totalCount`
 */
export const useOwnedAssets = createUseOwnedAssets(getOwnedAssets);
