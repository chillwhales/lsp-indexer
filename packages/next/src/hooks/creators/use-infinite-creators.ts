'use client';

import { getCreators } from '@lsp-indexer/next/actions';
import { createUseInfiniteCreators } from '@lsp-indexer/react';

/** Infinite scroll LSP4 creators via Next.js server action. */
export const useInfiniteCreators = createUseInfiniteCreators(getCreators);
