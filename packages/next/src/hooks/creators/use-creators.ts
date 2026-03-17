'use client';

import { getCreators } from '@lsp-indexer/next/actions';
import { createUseCreators } from '@lsp-indexer/react';

/** Paginated LSP4 creator list via Next.js server action. */
export const useCreators = createUseCreators(getCreators);
