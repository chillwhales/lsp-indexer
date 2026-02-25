import type {
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventSort,
} from '@lsp-indexer/types';

/**
 * Query key factory for DataChangedEvent domain.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 * Keys are structured so that invalidating a parent key automatically
 * invalidates all child keys.
 *
 * **Hierarchy:**
 * ```
 * dataChangedEventKeys.all                          → ['dataChangedEvents']
 * dataChangedEventKeys.latests()                    → ['dataChangedEvents', 'latest']
 * dataChangedEventKeys.latest(f, i)                 → ['dataChangedEvents', 'latest', { filter, include }]
 * dataChangedEventKeys.lists()                      → ['dataChangedEvents', 'list']
 * dataChangedEventKeys.list(...)                    → ['dataChangedEvents', 'list', ...]
 * dataChangedEventKeys.infinites()                  → ['dataChangedEvents', 'infinite']
 * dataChangedEventKeys.infinite(...)                → ['dataChangedEvents', 'infinite', ...]
 * ```
 *
 * **IMPORTANT:** `list`, `infinite`, and `latest` use separate namespaces to prevent
 * TanStack Query cache corruption between different query data structures.
 *
 * 3 hooks: `useLatestDataChangedEvent` (single latest), `useDataChangedEvents` (paginated list),
 * and `useInfiniteDataChangedEvents` (infinite scroll).
 *
 * **Cache invalidation examples:**
 * ```ts
 * // Invalidate ALL data changed event queries (latest + list + infinite)
 * queryClient.invalidateQueries({ queryKey: dataChangedEventKeys.all });
 *
 * // Invalidate all latest queries
 * queryClient.invalidateQueries({ queryKey: dataChangedEventKeys.latests() });
 *
 * // Invalidate all paginated list queries
 * queryClient.invalidateQueries({ queryKey: dataChangedEventKeys.lists() });
 *
 * // Invalidate all infinite scroll queries
 * queryClient.invalidateQueries({ queryKey: dataChangedEventKeys.infinites() });
 * ```
 */
export const dataChangedEventKeys = {
  /** Base key for all data changed event queries — invalidate this to clear the entire cache */
  all: ['dataChangedEvents'] as const,

  /** Parent key for all latest-single queries */
  latests: () => [...dataChangedEventKeys.all, 'latest'] as const,

  /** Key for a specific latest data changed event query */
  latest: (filter?: DataChangedEventFilter, include?: DataChangedEventInclude) =>
    [...dataChangedEventKeys.latests(), { filter, include }] as const,

  /** Parent key for all paginated list queries */
  lists: () => [...dataChangedEventKeys.all, 'list'] as const,

  /** Key for a specific paginated data changed event list query */
  list: (
    filter?: DataChangedEventFilter,
    sort?: DataChangedEventSort,
    limit?: number,
    offset?: number,
    include?: DataChangedEventInclude,
  ) => [...dataChangedEventKeys.lists(), filter, sort, limit, offset, include] as const,

  /** Parent key for all infinite scroll queries */
  infinites: () => [...dataChangedEventKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll data changed event query */
  infinite: (
    filter?: DataChangedEventFilter,
    sort?: DataChangedEventSort,
    include?: DataChangedEventInclude,
  ) => [...dataChangedEventKeys.infinites(), filter, sort, include] as const,
} as const;
