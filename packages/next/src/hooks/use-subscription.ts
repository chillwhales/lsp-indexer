'use client';

import { createUseSubscription } from '@lsp-indexer/react';
import { useSubscriptionClient } from '../subscriptions/context';

/**
 * Base subscription hook for Next.js. Binds the React factory to the
 * Next.js-specific SubscriptionClient from context.
 */
export const useSubscription = createUseSubscription(useSubscriptionClient);
