'use client';

import { createUseProfileSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time profile subscription. Delegates to React hook. */
export const useProfileSubscription = createUseProfileSubscription(useSubscription);
