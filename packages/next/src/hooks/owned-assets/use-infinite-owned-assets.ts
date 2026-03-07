'use client';

import { createUseInfiniteOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '../../actions/owned-assets';

/** Infinite scroll owned assets via Next.js server action. */
export const useInfiniteOwnedAssets = createUseInfiniteOwnedAssets(getOwnedAssets);
