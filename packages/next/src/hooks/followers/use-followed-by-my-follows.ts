'use client';

import { getFollowedByMyFollows } from '@lsp-indexer/next/actions';
import { createUseFollowedByMyFollows } from '@lsp-indexer/react';

/** Paginated followed-by-my-follows via Next.js server action. */
export const useFollowedByMyFollows = createUseFollowedByMyFollows(getFollowedByMyFollows);
