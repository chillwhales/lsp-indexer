'use client';

import { getEncryptedAssetsBatch } from '@lsp-indexer/next/actions';
import { createUseEncryptedAssetsBatch } from '@lsp-indexer/react';

/** Batch LSP29 encrypted asset lookup via Next.js server action. */
export const useEncryptedAssetsBatch = createUseEncryptedAssetsBatch(getEncryptedAssetsBatch);
