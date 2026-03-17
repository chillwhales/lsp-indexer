'use client';

import { getNfts } from '@lsp-indexer/next/actions';
import { createUseNfts } from '@lsp-indexer/react';

/** Paginated NFT list via Next.js server action. */
export const useNfts = createUseNfts(getNfts);
