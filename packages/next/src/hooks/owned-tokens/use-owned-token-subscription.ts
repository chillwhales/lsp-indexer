'use client';

import { createUseOwnedTokenSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time owned token subscription. Delegates to React hook. */
export const useOwnedTokenSubscription = createUseOwnedTokenSubscription(useSubscription);
