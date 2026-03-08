'use client';

import { createUseFollowerSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time follower subscription. Delegates to React hook. */
export const useFollowerSubscription = createUseFollowerSubscription(useSubscription);
