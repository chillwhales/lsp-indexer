'use client';

import { getOwnedAssets } from '@lsp-indexer/next/actions';
import { createUseInfiniteOwnedAssets } from '@lsp-indexer/react';

/** Infinite scroll owned assets via Next.js server action. */
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets(getOwnedAssets);
