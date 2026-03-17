'use client';

import { getIssuedAssets } from '@lsp-indexer/next/actions';
import { createUseIssuedAssets } from '@lsp-indexer/react';

/** Paginated LSP12 issued asset list via Next.js server action. */
export const useIssuedAssets = createUseIssuedAssets(getIssuedAssets);
