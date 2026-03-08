'use client';

import { createUseCreatorSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time creator subscription. Delegates to React hook. */
export const useCreatorSubscription = createUseCreatorSubscription(useSubscription);
