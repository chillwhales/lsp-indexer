'use client';

import { createUseIssuedAssets } from '@lsp-indexer/react';
import { getIssuedAssets } from '../../actions/issued-assets';

/** Paginated LSP12 issued asset list via Next.js server action. */
export const useIssuedAssets = createUseIssuedAssets(getIssuedAssets);
