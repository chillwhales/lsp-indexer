import type { DataChangedFilter, DataChangedSort } from '@lsp-indexer/types';

/**
 * Query key factory for ERC725 Data Changed Events queries.
 *
 * Follows the TkDodo hierarchical key pattern for granular cache invalidation.
 *
 * **Hierarchy:**
 * ```
 * dataChangedKeys.all                → ['data-changed']
 * dataChangedKeys.lists()            → ['data-changed', 'list']
 * dataChangedKeys.list(f, s, l, o)   → ['data-changed', 'list', { filter, sort, limit, offset }]
 * dataChangedKeys.infinites()        → ['data-changed', 'infinite']
 * dataChangedKeys.infinite(f, s)     → ['data-changed', 'infinite', { filter, sort }]
 * ```
 */
export const dataChangedKeys = {
  /** Base key for all data changed event queries */
  all: ['data-changed'] as const,

  /** Parent key for all paginated list queries (used with `useQuery`) */
  lists: () => [...dataChangedKeys.all, 'list'] as const,

  /** Key for a specific list query with filter, sort, and pagination params */
  list: (filter?: DataChangedFilter, sort?: DataChangedSort, limit?: number, offset?: number) =>
    [...dataChangedKeys.lists(), { filter, sort, limit, offset }] as const,

  /** Parent key for all infinite scroll queries (used with `useInfiniteQuery`) */
  infinites: () => [...dataChangedKeys.all, 'infinite'] as const,

  /** Key for a specific infinite scroll query with filter and sort params */
  infinite: (filter?: DataChangedFilter, sort?: DataChangedSort) =>
    [...dataChangedKeys.infinites(), { filter, sort }] as const,
} as const;
