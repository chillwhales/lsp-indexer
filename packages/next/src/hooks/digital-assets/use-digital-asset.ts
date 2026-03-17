'use client';

import { getDigitalAsset } from '@lsp-indexer/next/actions';
import { createUseDigitalAsset } from '@lsp-indexer/react';

/** Fetch a single digital asset by address via server action. */
export const useDigitalAsset = createUseDigitalAsset(getDigitalAsset);
