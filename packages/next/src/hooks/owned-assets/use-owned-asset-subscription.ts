'use client';

import { createUseOwnedAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time owned asset subscription. Delegates to React hook. */
export const useOwnedAssetSubscription = createUseOwnedAssetSubscription(useSubscription);
