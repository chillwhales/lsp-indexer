'use client';

import { createUseInfiniteIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '../../actions/issued-assets';

/** Infinite scroll LSP12 issued assets via Next.js server action. */
export const useInfiniteIssuedAssets = createUseInfiniteIssuedAssets(getIssuedAssets);
