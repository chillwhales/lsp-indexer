'use client';

import { getProfiles } from '@lsp-indexer/next/actions';
import { createUseInfiniteProfiles } from '@lsp-indexer/react';

/** Infinite scroll profiles via Next.js server action. */
export const useInfiniteProfiles = createUseInfiniteProfiles(getProfiles);
