'use client';

import { createUseOwnedAsset } from '@lsp-indexer/react';
import { getOwnedAsset } from '@lsp-indexer/next/actions';

/** Fetch a single owned asset by ID via server action. */
export const useOwnedAsset = createUseOwnedAsset(getOwnedAsset);
