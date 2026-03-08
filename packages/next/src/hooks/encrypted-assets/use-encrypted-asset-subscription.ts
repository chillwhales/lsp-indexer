'use client';

import { createUseEncryptedAssetSubscription } from '@lsp-indexer/react';
import { useSubscription } from '../use-subscription';

/** Real-time encrypted asset subscription. Delegates to React hook. */
export const useEncryptedAssetSubscription = createUseEncryptedAssetSubscription(useSubscription);
