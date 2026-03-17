'use client';

import { createUseNfts } from '@lsp-indexer/react';
import { getNfts } from '@lsp-indexer/next/actions';

/** Paginated NFT list via Next.js server action. */
export const useNfts = createUseNfts(getNfts);
