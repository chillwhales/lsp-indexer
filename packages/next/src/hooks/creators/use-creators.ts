'use client';

import { createUseCreators } from '@lsp-indexer/react';
import { getCreators } from '@lsp-indexer/next/actions';

/** Paginated LSP4 creator list via Next.js server action. */
export const useCreators = createUseCreators(getCreators);
