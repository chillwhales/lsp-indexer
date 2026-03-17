'use client';

import { getOwnedTokens } from '@lsp-indexer/next/actions';
import { createUseOwnedTokens } from '@lsp-indexer/react';

/** Paginated owned token list via Next.js server action. */
export const useOwnedTokens = createUseOwnedTokens(getOwnedTokens);
