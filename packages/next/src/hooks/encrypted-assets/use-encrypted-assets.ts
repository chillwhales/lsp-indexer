'use client';

import { createUseEncryptedAssets } from '@lsp-indexer/react';
import { getEncryptedAssets } from '../../actions/encrypted-assets';

/**
 * Fetch a paginated list of LSP29 encrypted asset records via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useEncryptedAssets`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ encryptedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `encryptedAssets` and `totalCount`
 */
export const useEncryptedAssets = createUseEncryptedAssets(getEncryptedAssets);
