'use client';

import { createUseOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '@lsp-indexer/next/actions';

/** Paginated owned token list via Next.js server action. */
export const useOwnedTokens = createUseOwnedTokens(getOwnedTokens);
