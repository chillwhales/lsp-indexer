'use client';

import { getCollectionAttributes } from '@lsp-indexer/next/actions';
import { createUseCollectionAttributes } from '@lsp-indexer/react';

/** Fetch distinct collection attributes via server action. */
export const useCollectionAttributes = createUseCollectionAttributes(getCollectionAttributes);
