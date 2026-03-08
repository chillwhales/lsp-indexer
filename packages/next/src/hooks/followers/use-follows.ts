'use client';

import { createUseFollows } from '@lsp-indexer/react';
import { getFollows } from '../../actions/followers';

/** Paginated follow relationship list via Next.js server action. */
export const useFollows = createUseFollows(getFollows);
