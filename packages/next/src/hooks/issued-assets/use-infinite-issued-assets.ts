'use client';

import { getIssuedAssets } from '@lsp-indexer/next/actions';
import { createUseInfiniteIssuedAssets } from '@lsp-indexer/react';

/** Infinite scroll LSP12 issued assets via Next.js server action. */
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets(getIssuedAssets);
