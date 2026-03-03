/**
 * Factory for useProfileSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfileSubscription(useSubscription, useQueryClient)`
 * with its own hooks (bound to the package-specific context).
 *
 * Supports the same `sort` and `include` params as `useProfiles` for API
 * consistency across query and subscription hooks.
 *
 * @see createUseSubscription — the lower-level factory this mirrors
 */
import {
  buildProfileIncludeDirectives,
  buildProfileOrderBy,
  buildProfileWhere,
  parseProfiles,
  profileKeys,
  ProfileSubscriptionDocument,
} from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
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
 * import { createUseProfileSubscription } from '@lsp-indexer/react';
 * import { useSubscription } from './use-subscription';
 * import { useQueryClient } from '@tanstack/react-query';
 * export const useProfileSubscription = createUseProfileSubscription(useSubscription, useQueryClient);
 * ```
 */
export function createUseProfileSubscription(
  useSubscription: UseSubscriptionFn,
  useQueryClient: () => QueryClient,
) {
  function useProfileSubscription<const I extends ProfileInclude>(
    params: UseProfileSubscriptionParams & { include: I },
  ): UseSubscriptionReturn<ProfileResult<I>>;
  function useProfileSubscription(
    params?: Omit<UseProfileSubscriptionParams, 'include'> & { include?: never },
  ): UseSubscriptionReturn<Profile>;
  function useProfileSubscription(
    params: UseProfileSubscriptionParams & { include?: ProfileInclude },
  ): UseSubscriptionReturn<PartialProfile>;
  function useProfileSubscription(
    params: UseProfileSubscriptionParams = {},
  ): UseSubscriptionReturn<PartialProfile> {
    const {
      filter,
      sort,
      limit = DEFAULT_SUBSCRIPTION_LIMIT,
      include,
      enabled = true,
      invalidate = false,
      onData,
      onReconnect,
    } = params;

    const where = buildProfileWhere(filter);
    const orderBy = buildProfileOrderBy(sort);
    const includeVars = buildProfileIncludeDirectives(include);
    const queryClient = useQueryClient();

    return useSubscription(
      {
        document: ProfileSubscriptionDocument,
        variables: {
          where: Object.keys(where).length > 0 ? where : undefined,
          order_by: orderBy,
          limit,
          ...includeVars,
        },
        extract: (result) => result.universal_profile,
        parser: (raw) => (include ? parseProfiles(raw, include) : parseProfiles(raw)),
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
  }

  return useProfileSubscription;
}
