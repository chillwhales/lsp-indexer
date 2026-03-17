'use client';

import { getOwnedToken } from '@lsp-indexer/next/actions';
import { createUseOwnedToken } from '@lsp-indexer/react';

/** Fetch a single owned token by ID via server action. */
export const useOwnedToken = createUseOwnedToken(getOwnedToken);
