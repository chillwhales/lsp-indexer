'use client';

import { createUseIssuedAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time issued asset subscription. Delegates to React hook. */
export const useIssuedAssetSubscription = createUseIssuedAssetSubscription(useSubscription);
