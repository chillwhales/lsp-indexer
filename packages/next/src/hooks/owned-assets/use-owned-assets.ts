'use client';

import { getOwnedAssets } from '@lsp-indexer/next/actions';
import { createUseOwnedAssets } from '@lsp-indexer/react';

/** Paginated owned asset list via Next.js server action. */
export const useOwnedAssets = createUseOwnedAssets(getOwnedAssets);
