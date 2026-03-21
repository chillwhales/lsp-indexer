'use client';

import { getMutualFollowers } from '@lsp-indexer/next/actions';
import { createUseInfiniteMutualFollowers } from '@lsp-indexer/react';

/** Infinite scroll mutual followers via Next.js server action. */
export const useInfiniteMutualFollowers = createUseInfiniteMutualFollowers(getMutualFollowers);
