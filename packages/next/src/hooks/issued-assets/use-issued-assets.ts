'use client';

import { createUseIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '../../actions/issued-assets';

/**
 * Fetch a paginated list of LSP12 issued asset records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useIssuedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ issuedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `issuedAssets` and `totalCount`
 */
export const useIssuedAssets = createUseIssuedAssets(getIssuedAssets);
