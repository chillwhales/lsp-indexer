'use client';

import { getProfiles } from '@lsp-indexer/next/actions';
import { createUseProfiles } from '@lsp-indexer/react';

/** Paginated profile list via Next.js server action. */
export const useProfiles = createUseProfiles(getProfiles);
