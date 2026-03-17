'use client';

import { createUseInfiniteNfts } from '@lsp-indexer/react';
import { getNfts } from '@lsp-indexer/next/actions';

/** Infinite scroll NFTs via Next.js server action. */
export const useInfiniteNfts = createUseInfiniteNfts(getNfts);
