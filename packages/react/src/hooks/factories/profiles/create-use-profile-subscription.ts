/**
 * Factory for useProfileSubscription — shared between `@lsp-indexer/react`
 * and `@lsp-indexer/next`.
 *
 * Each package calls `createUseProfileSubscription(useSubscription)` with its
 * own hook (bound to the package-specific context). `useQueryClient` is
 * imported directly since it's identical across all packages.
 *
 * Domain-specific config assembly (document, variables, extract, parser) is
 * delegated to `buildProfileSubscriptionConfig` in the node service layer,
 * mirroring how `fetchProfiles` encapsulates query assembly.
 *
 * ## Why this takes `useSubscription` instead of wrapping `createUseSubscription`
 *
 * Query domain factories wrap generic factories directly:
 *   `createUseProfile(queryFn)` → wraps `createUseDetail(config)`
 *   `createUseProfiles(queryFn)` → wraps `createUseList(config)`
 *
 * Subscription domain factories **cannot** follow this pattern because
 * `useSubscription` is already context-bound (different per package —
 * React uses direct WebSocket context, Next.js uses a proxy context).
 * The domain factory's job is to wire up domain config with hook lifecycle,
 * not to manage subscription lifecycle or context binding. Accepting the
 * already-instantiated `useSubscription` hook keeps these concerns cleanly
 * separated.
 *
 * @see createUseSubscription — produces the `useSubscription` hook this factory consumes
 * @see buildProfileSubscriptionConfig — node service that builds the subscription config
 */
import { buildProfileSubscriptionConfig, profileKeys } from '@lsp-indexer/node';
import type {
  PartialProfile,
  Profile,
  ProfileInclude,
  ProfileResult,
  UseSubscriptionReturn,
} from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SUBSCRIPTION_LIMIT } from '../../../constants';
import { UseProfileSubscriptionParams, UseSubscriptionFn } from '../../types';

/**
 * Create a `useProfileSubscription` hook bound to a specific `useSubscription`.
 *
 * @param useSubscription - The package-specific useSubscription hook
 *
 * @example
 * ```ts
 * import { createUseProfileSubscription } from '@lsp-indexer/react';
 * import { useSubscription } from './use-subscription';
 * export const useProfileSubscription = createUseProfileSubscription(useSubscription);
 * ```
 */
export function createUseProfileSubscription(useSubscription: UseSubscriptionFn) {
  function useProfileSubscription<const I extends ProfileInclude>(
    params: UseProfileSubscriptionParams & {
      include: I;
      onData?: (data: ProfileResult<I>[]) => void;
    },
  ): UseSubscriptionReturn<ProfileResult<I>>;
  function useProfileSubscription(
    params?: Omit<UseProfileSubscriptionParams, 'include'> & {
      include?: never;
      onData?: (data: Profile[]) => void;
    },
  ): UseSubscriptionReturn<Profile>;
  function useProfileSubscription(
    params: UseProfileSubscriptionParams & {
      include?: ProfileInclude;
      onData?: (data: PartialProfile[]) => void;
    },
  ): UseSubscriptionReturn<PartialProfile>;
  // Implementation signature — `any[]` for onData avoids contravariance conflict
  // between overloads. Only the overload signatures are visible to consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function useProfileSubscription(
    params: UseProfileSubscriptionParams & { onData?: (data: any[]) => void } = {},
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

    const queryClient = useQueryClient();
    const config = buildProfileSubscriptionConfig({ filter, sort, limit, include });

    return useSubscription(config, {
      enabled,
      invalidate,
      invalidateKeys: invalidate ? [profileKeys.all] : undefined,
      queryClient: invalidate ? queryClient : undefined,
      onData,
      onReconnect,
    });
  }

  return useProfileSubscription;
}
