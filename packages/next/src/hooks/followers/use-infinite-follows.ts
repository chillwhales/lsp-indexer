'use client';

import { getFollows } from '@lsp-indexer/next/actions';
import { createUseInfiniteFollows } from '@lsp-indexer/react';

/** Infinite scroll follow relationships via Next.js server action. */
export const useInfiniteFollows = createUseInfiniteFollows(getFollows);
