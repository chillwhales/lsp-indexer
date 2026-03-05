'use client';

import { createUseInfiniteEncryptedAssets } from '@lsp-indexer/react';
import { getEncryptedAssets } from '../../actions/encrypted-assets';

/**
 * Fetch LSP29 encrypted asset records with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteEncryptedAssets`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter/sort/pageSize/include
 * @returns `{ encryptedAssets, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened encryptedAssets array with infinite scroll controls
 */
export const useInfiniteEncryptedAssets = createUseInfiniteEncryptedAssets(getEncryptedAssets);
