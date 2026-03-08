'use client';

import { createUseInfiniteDataChangedEvents } from '@lsp-indexer/react';
import { getDataChangedEvents } from '../../actions/data-changed-events';

/** Infinite scroll DataChanged events via Next.js server action. */
export const useInfiniteDataChangedEvents =
  createUseInfiniteDataChangedEvents(getDataChangedEvents);
