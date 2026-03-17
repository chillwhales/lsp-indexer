'use client';

import { createUseOwnedToken } from '@lsp-indexer/react';
import { getOwnedToken } from '@lsp-indexer/next/actions';

/** Fetch a single owned token by ID via server action. */
export const useOwnedToken = createUseOwnedToken(getOwnedToken);
