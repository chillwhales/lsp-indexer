'use client';

import { createUseInfiniteIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '@lsp-indexer/next/actions';

/** Infinite scroll LSP12 issued assets via Next.js server action. */
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets(getIssuedAssets);
