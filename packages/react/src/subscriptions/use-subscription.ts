import { useSubscriptionClient } from './context';
import { createUseSubscription } from './create-use-subscription';

/**
 * Thin wrapper around SubscriptionClient for React applications.
 *
 * This hook:
 * 1. Creates a subscription instance using the client from context
 * 2. Syncs React state with the subscription instance state
 * 3. Handles framework-specific concerns like QueryClient invalidation
 * 4. Provides the same API as the Next.js package for consistency
 *
 * The heavy lifting (connection management, parsing, error handling) is done
 * by the SubscriptionClient and subscription instances.
 *
 * @see createUseSubscription — shared hook factory
 */
export const useSubscription = createUseSubscription(useSubscriptionClient);
