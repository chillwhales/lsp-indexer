'use client';

import { getDataChangedEvents } from '@lsp-indexer/next/actions';
import { createUseInfiniteDataChangedEvents } from '@lsp-indexer/react';

/** Infinite scroll DataChanged events via Next.js server action. */
export const useInfiniteDataChangedEvents =
  createUseInfiniteDataChangedEvents(getDataChangedEvents);
