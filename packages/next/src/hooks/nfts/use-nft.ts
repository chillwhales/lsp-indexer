'use client';

import { createUseNft } from '@lsp-indexer/react';
import { getNft } from '@lsp-indexer/next/actions';

/** Fetch a single NFT by collection address and token ID via server action. */
export const useNft = createUseNft(getNft);
