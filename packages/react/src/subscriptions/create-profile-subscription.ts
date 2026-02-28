import { createProfileSubscriptionConfig, profileKeys } from '@lsp-indexer/node';
import type {
  Profile,
  ProfileFilter,
  ProfileInclude,
  SubscriptionConfig,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';

import type { UseSubscriptionOptions } from './create-use-subscription';

// ---------------------------------------------------------------------------
// Hook params — the user-facing API
// ---------------------------------------------------------------------------

/** Params accepted by the `useProfileSubscription` hook. */
export interface UseProfileSubscriptionParams {
  /** Filter criteria to narrow which profiles to subscribe to */
  filter?: ProfileFilter;
  /** Control which nested fields are included in subscription data */
  include?: ProfileInclude;
  /** Maximum number of results per subscription update (default: 10) */
  limit?: number;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
  /** Whether to invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback fired when new subscription data arrives */
  onData?: (data: Profile[]) => void;
  /** Callback fired when the WebSocket reconnects after a disconnect */
  onReconnect?: () => void;
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

/**
 * Create a `useProfileSubscription` hook bound to a specific `useSubscription` hook.
 *
 * Uses `createProfileSubscriptionConfig` from `@lsp-indexer/node` for all
 * domain logic (document, variable builders, parser) and wires it with the
 * provided `useSubscription` hook and `useQueryClient` for cache invalidation.
 *
 * Both `@lsp-indexer/react` and `@lsp-indexer/next` call this factory with
 * their own `useSubscription` to produce a package-specific hook — same
 * pattern as `createUseSubscription`.
 *
 * @param useSubscriptionHook - The generic `useSubscription` hook (React or Next.js variant)
 * @returns A `useProfileSubscription` hook ready for export
 *
 * @example
 * ```ts
 * // packages/react/src/hooks/profiles.ts
 * import { createProfileSubscription } from '../subscriptions/create-profile-subscription';
 * import { useSubscription } from '../subscriptions/use-subscription';
 *
 * export const useProfileSubscription = createProfileSubscription(useSubscription);
 * ```
 */
export function createProfileSubscription(
  useSubscriptionHook: <T>(
    config: SubscriptionConfig<T>,
    options?: UseSubscriptionOptions<T>,
  ) => UseSubscriptionReturn<T>,
) {
  return function useProfileSubscription(
    params: UseProfileSubscriptionParams = {},
  ): UseSubscriptionReturn<Profile> {
    const {
      filter,
      include,
      limit,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    // Domain config: document, variables, parser (all from @lsp-indexer/node)
    const config = createProfileSubscriptionConfig({ filter, include, limit });

    // Attempt to get QueryClient for cache invalidation. Falls back gracefully
    // when no QueryClientProvider wraps the component tree.
    let queryClient;
    try {
      queryClient = useQueryClient();
    } catch {
      // No QueryClientProvider — cache invalidation disabled
    }

    // Hook options: framework concerns (enabled, invalidation, callbacks)
    return useSubscriptionHook<Profile>(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [profileKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  };
}
