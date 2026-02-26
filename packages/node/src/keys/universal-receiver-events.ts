import type {
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';

/**
 * Query key factory for UniversalReceiverEvent domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * universalReceiverEventKeys.all                          → ['universalReceiverEvents']
 * universalReceiverEventKeys.lists()                      → ['universalReceiverEvents', 'list']
 * universalReceiverEventKeys.list(...)                    → ['universalReceiverEvents', 'list', ...]
 * universalReceiverEventKeys.infinites()                  → ['universalReceiverEvents', 'infinite']
 * universalReceiverEventKeys.infinite(...)                → ['universalReceiverEvents', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list` and `infinite` use separate namespaces to prevent
 * TanStack Query cache corruption between useQuery and useInfiniteQuery.
 *
 * Only 2 hooks: `useUniversalReceiverEvents` (paginated list) and
 * `useInfiniteUniversalReceiverEvents` (infinite scroll). No singular hook —
 * event tables have no natural key (opaque Hasura ID only).
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL universal receiver event queries (list + infinite)
 * queryClient.invalidateQueries({ queryKey: universalReceiverEventKeys.all });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: universalReceiverEventKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: universalReceiverEventKeys.infinites() });
 * ```
 */
export const universalReceiverEventKeys = {
  /** Base key for all universal receiver event queries — invalidate this to clear the entire cache */
  all: ['universalReceiverEvents'] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...universalReceiverEventKeys.all, 'list'] as const,

  /** Key for a specific paginated universal receiver event list query */
  list: (
    filter?: UniversalReceiverEventFilter,
    sort?: UniversalReceiverEventSort,
    limit?: number,
    offset?: number,
    include?: UniversalReceiverEventInclude,
  ) => [...universalReceiverEventKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...universalReceiverEventKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll universal receiver event query */
  infinite: (
    filter?: UniversalReceiverEventFilter,
    sort?: UniversalReceiverEventSort,
    include?: UniversalReceiverEventInclude,
  ) => [...universalReceiverEventKeys.infinites(), filter, sort, include] as const,
} as const;
