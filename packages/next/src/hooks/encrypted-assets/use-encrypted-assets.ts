'use client';

import { getEncryptedAssets } from '@lsp-indexer/next/actions';
import { createUseEncryptedAssets } from '@lsp-indexer/react';

/** Paginated LSP29 encrypted asset list via Next.js server action. */
export const useEncryptedAssets = createUseEncryptedAssets(getEncryptedAssets);
