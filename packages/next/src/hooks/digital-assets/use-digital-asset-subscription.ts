'use client';

import { createUseDigitalAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time digital asset subscription. Delegates to React hook. */
export const useDigitalAssetSubscription = createUseDigitalAssetSubscription(useSubscription);
