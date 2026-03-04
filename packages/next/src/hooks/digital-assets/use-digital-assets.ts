'use client';

import { createUseDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '../../actions/digital-assets';

/**
 * Fetch a paginated list of digital assets via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ digitalAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `digitalAssets` and `totalCount`
 */
export const useDigitalAssets = createUseDigitalAssets((p) => getDigitalAssets(p));
