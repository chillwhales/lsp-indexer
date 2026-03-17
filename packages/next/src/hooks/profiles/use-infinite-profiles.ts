'use client';

import { createUseInfiniteProfiles } from '@lsp-indexer/react';
import { getProfiles } from '@lsp-indexer/next/actions';

/** Infinite scroll profiles via Next.js server action. */
export const useInfiniteProfiles = createUseInfiniteProfiles(getProfiles);
