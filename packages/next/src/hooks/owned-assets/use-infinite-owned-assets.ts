'use client';

import { createUseInfiniteOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '@lsp-indexer/next/actions';

/** Infinite scroll owned assets via Next.js server action. */
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets(getOwnedAssets);
