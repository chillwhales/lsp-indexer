'use client';

import { getOwnedTokens } from '@lsp-indexer/next/actions';
import { createUseInfiniteOwnedTokens } from '@lsp-indexer/react';

/** Infinite scroll owned tokens via Next.js server action. */
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens(getOwnedTokens);
