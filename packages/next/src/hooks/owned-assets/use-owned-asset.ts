'use client';

import { createUseOwnedAsset } from '@lsp-indexer/react';
import { getOwnedAsset } from '../../actions/owned-assets';

/** Fetch a single owned asset by ID via server action. */
export const useOwnedAsset = createUseOwnedAsset(getOwnedAsset);
