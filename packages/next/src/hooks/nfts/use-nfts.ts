'use client';

import { createUseNfts } from '@lsp-indexer/react';
import { getNfts } from '../../actions/nfts';

/**
 * Fetch a paginated list of NFTs via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNfts`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ nfts, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `nfts` and `totalCount`
 */
export const useNfts = createUseNfts((params) =>
  params.include ? getNfts(params) : getNfts(params),
);
