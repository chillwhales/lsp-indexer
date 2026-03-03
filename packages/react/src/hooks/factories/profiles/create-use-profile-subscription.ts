/**
 * Factory for useProfileSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfileSubscription(useSubscription)` with
 * its own `useSubscription` hook (bound to the package-specific context).
 *
 * @see createUseSubscription — the lower-level factory this mirrors
 */
import {
  buildProfileWhere,
  parseProfiles,
  profileKeys,
  ProfileSubscriptionDocument,
} from '@lsp-indexer/node';
import type { Profile, UseSubscriptionReturn } from '@lsp-indexer/types';
import { QueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseProfileSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useProfileSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 * @param useQueryClient - TanStack Query client hook for cache invalidation
 *
 * @example
 * ```ts
 * // packages/react/src/subscriptions/profiles.ts
 * import { createUseProfileSubscription } from './create-use-profile-subscription';
 * import { useSubscription } from './use-subscription';
 * import { useQueryClient } from '@tanstack/react-query';
 * export const useProfileSubscription = createUseProfileSubscription(useSubscription, useQueryClient);
 * ```
 */
export function createUseProfileSubscription(
  useSubscription: UseSubscriptionFn,
  useQueryClient: () => QueryClient,
) {
  return function useProfileSubscription(
    params: UseProfileSubscriptionParams = {},
  ): UseSubscriptionReturn<Profile> {
    const {
      filter,
      limit = DEFAULT_SUBSCRIPTION_LIMIT,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    const where = buildProfileWhere(filter);
    const queryClient = useQueryClient();

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
