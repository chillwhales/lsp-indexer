'use client';

import { createUseOwnedAsset } from '@lsp-indexer/react';
import { getOwnedAsset } from '../../actions/owned-assets';

/**
 * Fetch a single owned asset by unique ID via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useOwnedAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Owned asset ID and optional include config
 * @returns `{ ownedAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `ownedAsset`
 */
export const useOwnedAsset = createUseOwnedAsset(getOwnedAsset);
