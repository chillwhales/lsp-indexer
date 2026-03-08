'use client';

import { createUseNftSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time NFT subscription. Delegates to React hook. */
export const useNftSubscription = createUseNftSubscription(useSubscription);
