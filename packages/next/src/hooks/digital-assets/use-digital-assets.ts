'use client';

import { createUseDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '../../actions/digital-assets';

/** Paginated digital asset list via Next.js server action. */
export const useDigitalAssets = createUseDigitalAssets(getDigitalAssets);
