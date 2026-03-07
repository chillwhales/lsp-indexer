'use client';

import { createUseNfts } from '@lsp-indexer/react';
import { getNfts } from '../../actions/nfts';

/** Paginated NFT list via Next.js server action. */
export const useNfts = createUseNfts(getNfts);
