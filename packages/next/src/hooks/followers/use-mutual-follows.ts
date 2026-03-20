'use client';

import { getMutualFollows } from '@lsp-indexer/next/actions';
import { createUseMutualFollows } from '@lsp-indexer/react';

/** Paginated mutual follows (profiles both addresses follow) via Next.js server action. */
export const useMutualFollows = createUseMutualFollows(getMutualFollows);
