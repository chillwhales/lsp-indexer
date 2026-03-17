'use client';

import { getProfile } from '@lsp-indexer/next/actions';
import { createUseProfile } from '@lsp-indexer/react';

/** Fetch a single profile by address. Wraps the React hook with Next.js server action. */
export const useProfile = createUseProfile(getProfile);
