'use client';

import { createUseOwnedAssets } from '@lsp-indexer/react';
import { getOwnedAssets } from '../../actions/owned-assets';

/** Paginated owned asset list via Next.js server action. */
export const useOwnedAssets = createUseOwnedAssets(getOwnedAssets);
