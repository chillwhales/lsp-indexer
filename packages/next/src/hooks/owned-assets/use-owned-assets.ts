'use client';

import { createUseOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '@lsp-indexer/next/actions';

/** Paginated owned asset list via Next.js server action. */
export const useOwnedAssets = createUseOwnedAssets(getOwnedAssets);
