'use client';

import { createUseCreators } from '@lsp-indexer/react';
import { getCreators } from '../../actions/creators';

/** Paginated LSP4 creator list via Next.js server action. */
export const useCreators = createUseCreators(getCreators);
