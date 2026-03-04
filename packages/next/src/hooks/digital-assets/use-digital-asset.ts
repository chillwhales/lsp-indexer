'use client';

import { createUseDigitalAsset } from '@lsp-indexer/react';
import { getDigitalAsset } from '../../actions/digital-assets';

/**
 * Fetch a single digital asset by address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useDigitalAsset`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Digital asset address and optional include config
 * @returns `{ digitalAsset, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `digitalAsset`
 */
export const useDigitalAsset = createUseDigitalAsset(getDigitalAsset);
