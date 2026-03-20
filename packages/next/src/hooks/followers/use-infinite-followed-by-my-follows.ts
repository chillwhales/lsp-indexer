'use client';

import { getFollowedByMyFollows } from '@lsp-indexer/next/actions';
import { createUseInfiniteFollowedByMyFollows } from '@lsp-indexer/react';

/** Infinite scroll followed-by-my-follows via Next.js server action. */
export const useInfiniteFollowedByMyFollows =
  createUseInfiniteFollowedByMyFollows(getFollowedByMyFollows);
