'use client';

import { getEncryptedAssets } from '@lsp-indexer/next/actions';
import { createUseInfiniteEncryptedAssets } from '@lsp-indexer/react';

/** Infinite scroll LSP29 encrypted assets via Next.js server action. */
export const useInfiniteEncryptedAssets = createUseInfiniteEncryptedAssets(getEncryptedAssets);
