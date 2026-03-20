'use client';

import { getMutualFollowers } from '@lsp-indexer/next/actions';
import { createUseMutualFollowers } from '@lsp-indexer/react';

/** Paginated mutual followers (profiles that follow both addresses) via Next.js server action. */
export const useMutualFollowers = createUseMutualFollowers(getMutualFollowers);
