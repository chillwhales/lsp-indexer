'use client';

import { createUseInfiniteCreators } from '@lsp-indexer/react';
import { getCreators } from '../../actions/creators';

/** Infinite scroll LSP4 creators via Next.js server action. */
export const useInfiniteCreators = createUseInfiniteCreators(getCreators);
