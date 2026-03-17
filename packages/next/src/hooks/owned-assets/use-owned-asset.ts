'use client';

import { getOwnedAsset } from '@lsp-indexer/next/actions';
import { createUseOwnedAsset } from '@lsp-indexer/react';

/** Fetch a single owned asset by ID via server action. */
export const useOwnedAsset = createUseOwnedAsset(getOwnedAsset);
