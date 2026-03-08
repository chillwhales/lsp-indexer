'use client';

import { createUseInfiniteEncryptedAssets } from '@lsp-indexer/react';
import { getEncryptedAssets } from '../../actions/encrypted-assets';

/** Infinite scroll LSP29 encrypted assets via Next.js server action. */
export const useInfiniteEncryptedAssets = createUseInfiniteEncryptedAssets(getEncryptedAssets);
