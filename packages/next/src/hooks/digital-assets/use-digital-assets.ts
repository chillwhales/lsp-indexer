'use client';

import { createUseDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '@lsp-indexer/next/actions';

/** Paginated digital asset list via Next.js server action. */
export const useDigitalAssets = createUseDigitalAssets(getDigitalAssets);
