'use client';

import { createUseIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '@lsp-indexer/next/actions';

/** Paginated LSP12 issued asset list via Next.js server action. */
export const useIssuedAssets = createUseIssuedAssets(getIssuedAssets);
