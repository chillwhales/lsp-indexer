'use client';

import { createUseOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '../../actions/owned-tokens';

/** Paginated owned token list via Next.js server action. */
export const useOwnedTokens = createUseOwnedTokens(getOwnedTokens);
