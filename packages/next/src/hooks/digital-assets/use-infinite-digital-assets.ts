'use client';

import { getDigitalAssets } from '@lsp-indexer/next/actions';
import { createUseInfiniteDigitalAssets } from '@lsp-indexer/react';

/** Infinite scroll digital assets via Next.js server action. */
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets(getDigitalAssets);
