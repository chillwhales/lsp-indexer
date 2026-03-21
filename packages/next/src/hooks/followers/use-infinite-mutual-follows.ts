'use client';

import { getMutualFollows } from '@lsp-indexer/next/actions';
import { createUseInfiniteMutualFollows } from '@lsp-indexer/react';

/** Infinite scroll mutual follows via Next.js server action. */
export const useInfiniteMutualFollows = createUseInfiniteMutualFollows(getMutualFollows);
