'use client';

import { createUseInfiniteDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '../../actions/digital-assets';

/** Infinite scroll digital assets via Next.js server action. */
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets(getDigitalAssets);
