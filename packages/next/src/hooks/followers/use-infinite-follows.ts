'use client';

import { createUseInfiniteFollows } from '@lsp-indexer/react';
import { getFollows } from '../../actions/followers';

/** Infinite scroll follow relationships via Next.js server action. */
export const useInfiniteFollows = createUseInfiniteFollows(getFollows);
