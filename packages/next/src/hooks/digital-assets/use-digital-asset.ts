'use client';

import { createUseDigitalAsset } from '@lsp-indexer/react';
import { getDigitalAsset } from '@lsp-indexer/next/actions';

/** Fetch a single digital asset by address via server action. */
export const useDigitalAsset = createUseDigitalAsset(getDigitalAsset);
