'use client';

import { createUseInfiniteDigitalAssets } from '@lsp-indexer/react';
import { getDigitalAssets } from '@lsp-indexer/next/actions';

/** Infinite scroll digital assets via Next.js server action. */
export const useInfiniteDigitalAssets = createUseInfiniteDigitalAssets(getDigitalAssets);
