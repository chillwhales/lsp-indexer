'use client';

import { createUseInfiniteOwnedTokens } from '@lsp-indexer/react';
import { getOwnedTokens } from '@lsp-indexer/next/actions';

/** Infinite scroll owned tokens via Next.js server action. */
export const useInfiniteOwnedTokens = createUseInfiniteOwnedTokens(getOwnedTokens);
