'use client';

import { createUseNft } from '@lsp-indexer/react';
import { getNft } from '../../actions/nfts';

/**
 * Fetch a single NFT by collection address and token ID (or formatted token ID)
 * via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNft`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - NFT collection address, tokenId/formattedTokenId, and optional include config
 * @returns `{ nft, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `nft`
 */
export const useNft = createUseNft(getNft);
