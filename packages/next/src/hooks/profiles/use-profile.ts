'use client';

import { createUseProfile } from '@lsp-indexer/react';
import { getProfile } from '../../actions/profiles';

/** Fetch a single profile by address. Wraps the React hook with Next.js server action. */
export const useProfile = createUseProfile(getProfile);
