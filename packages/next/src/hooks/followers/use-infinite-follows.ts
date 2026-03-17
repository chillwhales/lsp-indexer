'use client';

import { createUseInfiniteFollows } from '@lsp-indexer/react';
import { getFollows } from '@lsp-indexer/next/actions';

/** Infinite scroll follow relationships via Next.js server action. */
export const useInfiniteFollows = createUseInfiniteFollows(getFollows);
