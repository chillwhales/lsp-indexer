'use client';

import { getNfts } from '@lsp-indexer/next/actions';
import { createUseInfiniteNfts } from '@lsp-indexer/react';

/** Infinite scroll NFTs via Next.js server action. */
export const useInfiniteNfts = createUseInfiniteNfts(getNfts);
