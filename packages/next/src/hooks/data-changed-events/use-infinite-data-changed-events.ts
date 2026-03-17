'use client';

import { createUseInfiniteDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '@lsp-indexer/next/actions';

/** Infinite scroll DataChanged events via Next.js server action. */
export const useInfiniteDataChangedEvents =
  createUseInfiniteDataChangedEvents(getDataChangedEvents);
