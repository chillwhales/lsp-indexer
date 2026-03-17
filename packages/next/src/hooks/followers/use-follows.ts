'use client';

import { getFollows } from '@lsp-indexer/next/actions';
import { createUseFollows } from '@lsp-indexer/react';

/** Paginated follow relationship list via Next.js server action. */
export const useFollows = createUseFollows(getFollows);
