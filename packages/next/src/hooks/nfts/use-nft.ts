'use client';

import { getNft } from '@lsp-indexer/next/actions';
import { createUseNft } from '@lsp-indexer/react';

/** Fetch a single NFT by collection address and token ID via server action. */
export const useNft = createUseNft(getNft);
