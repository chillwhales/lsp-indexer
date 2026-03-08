'use client';

import { createUseProfiles } from '@lsp-indexer/react';
import { getProfiles } from '../../actions/profiles';

/** Paginated profile list via Next.js server action. */
export const useProfiles = createUseProfiles(getProfiles);
