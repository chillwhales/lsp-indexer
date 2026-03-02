'use client';

import {
  buildProfileWhere,
  parseProfiles,
  profileKeys,
  ProfileSubscriptionDocument,
} from '@lsp-indexer/node';
import type { Profile, ProfileFilter, UseSubscriptionReturn } from '@lsp-indexer/types';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from './use-subscription';

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

export function useProfileSubscription(
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

  // Always call useQueryClient unconditionally (Rules of Hooks).
  let queryClient: import('@tanstack/react-query').QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    // No QueryClientProvider — hook still functions without cache invalidation
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
}
