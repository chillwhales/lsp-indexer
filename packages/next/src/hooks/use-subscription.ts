'use client';

import { createUseSubscription } from '@lsp-indexer/react';
import { useSubscriptionClient } from '../subscriptions/context';

/**
 * Thin wrapper around SubscriptionClient for Next.js applications.
 *
 * This hook:
 * 1. Creates a subscription instance using the client from context
 * 2. Syncs React state with the subscription instance state
 * 3. Handles framework-specific concerns like QueryClient invalidation
 * 4. Provides the same API as the React package for consistency
 *
 * The heavy lifting (connection management, parsing, error handling) is done
 * by the SubscriptionClient and subscription instances.
 *
 * @see createUseSubscription — shared hook factory in `@lsp-indexer/react`
 */
export const useSubscription = createUseSubscription(useSubscriptionClient);
