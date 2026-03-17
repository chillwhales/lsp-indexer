'use client';

import { getDigitalAssets } from '@lsp-indexer/next/actions';
import { createUseDigitalAssets } from '@lsp-indexer/react';

/** Paginated digital asset list via Next.js server action. */
export const useDigitalAssets = createUseDigitalAssets(getDigitalAssets);
