'use client';

import { createUseNft } from '@lsp-indexer/react';
import { getNft } from '../../actions/nfts';

/** Fetch a single NFT by collection address and token ID via server action. */
export const useNft = createUseNft(getNft);
