/**
 * Factory for useProfileSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfileSubscription(useSubscription)` with
 * its own `useSubscription` hook (bound to the package-specific context).
 *
 * @see createUseSubscription — the lower-level factory this mirrors
 */
'use client';

import type { SubscriptionConfig } from '@lsp-indexer/node';
import {
  buildProfileWhere,
  parseProfiles,
  profileKeys,
  ProfileSubscriptionDocument,
} from '@lsp-indexer/node';
import type { Profile, ProfileFilter, UseSubscriptionReturn } from '@lsp-indexer/types';
import type { UseSubscriptionOptions } from './create-use-subscription';

const DEFAULT_LIMIT = 10;

export interface UseProfileSubscriptionParams {
  /** Filter criteria (optional — omit for all profiles) */
  filter?: ProfileFilter;
  /** Maximum profiles in subscription result (default: 10) */
  limit?: number;
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Invalidate TanStack Query cache on subscription data (default: false) */
  invalidate?: boolean;
  /** Callback when subscription receives new data */
  onData?: (data: Profile[]) => void;
  /** Callback when WebSocket reconnects after a drop */
  onReconnect?: () => void;
}

/**
 * The `useSubscription` function signature that domain factories depend on.
 * Both `@lsp-indexer/react` and `@lsp-indexer/next` produce a function with
 * this shape via `createUseSubscription`.
 */
type UseSubscriptionFn = <TResult, TVariables extends Record<string, unknown>, TRaw, TParsed>(
  config: SubscriptionConfig<TResult, TVariables, TRaw, TParsed>,
  options?: UseSubscriptionOptions<TParsed>,
) => UseSubscriptionReturn<TParsed>;

/**
 * Create a `useProfileSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 * @param useQueryClient - Optional TanStack Query client hook for cache invalidation
 *
 * @example
 * ```ts
 * // packages/react/src/subscriptions/profiles.ts
 * import { createUseProfileSubscription } from './create-use-profile-subscription';
 * import { useSubscription } from './use-subscription';
 * export const useProfileSubscription = createUseProfileSubscription(useSubscription);
 * ```
 */
export function createUseProfileSubscription(
  useSubscription: UseSubscriptionFn,
  useQueryClient?: () => import('@tanstack/react-query').QueryClient,
) {
  return function useProfileSubscription(
    params: UseProfileSubscriptionParams = {},
  ): UseSubscriptionReturn<Profile> {
    const {
      filter,
      limit = DEFAULT_LIMIT,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    const where = buildProfileWhere(filter);

    // Call useQueryClient unconditionally (Rules of Hooks) if provided.
    // The result is only passed to useSubscription when invalidate is true.
    let queryClient: import('@tanstack/react-query').QueryClient | undefined;
    if (useQueryClient) {
      try {
        queryClient = useQueryClient();
      } catch {
        // No QueryClientProvider — hook still functions without cache invalidation
      }
    }

    // All 4 type params inferred from the config — zero explicit type arguments.
    return useSubscription(
      {
        document: ProfileSubscriptionDocument,
        variables: {
          where: Object.keys(where).length > 0 ? where : undefined,
          order_by: undefined, // entity domain — Hasura default sort
          limit,
        },
        extract: (result) => result.universal_profile,
        parser: (raw) => parseProfiles(raw),
      },
      {
        enabled,
        invalidate,
        invalidateKeys: invalidate ? [profileKeys.all] : undefined,
        queryClient: invalidate ? queryClient : undefined,
        onData,
        onReconnect,
      },
    );
  };
}
