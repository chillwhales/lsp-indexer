'use client';

import { createUseEncryptedAssets } from '@lsp-indexer/react';
import { getEncryptedAssets } from '@lsp-indexer/next/actions';

/** Paginated LSP29 encrypted asset list via Next.js server action. */
export const useEncryptedAssets = createUseEncryptedAssets(getEncryptedAssets);
