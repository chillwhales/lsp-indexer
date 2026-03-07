'use client';

import { createUseInfiniteOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '../../actions/owned-tokens';

/** Infinite scroll owned tokens via Next.js server action. */
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens(getOwnedTokens);
