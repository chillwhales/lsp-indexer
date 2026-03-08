import type {
  DataChangedEventFilter,
  DataChangedEventInclude,
  DataChangedEventSort,
} from '@lsp-indexer/types';

/**
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
 */
export const dataChangedEventKeys = {
  all: ['dataChangedEvents'] as const,

  latests: () => [...dataChangedEventKeys.all, 'latest'] as const,

  latest: (filter?: DataChangedEventFilter, include?: DataChangedEventInclude) =>
    [...dataChangedEventKeys.latests(), { filter, include }] as const,

  lists: () => [...dataChangedEventKeys.all, 'list'] as const,

  list: (
    filter?: DataChangedEventFilter,
    sort?: DataChangedEventSort,
    limit?: number,
    offset?: number,
    include?: DataChangedEventInclude,
  ) => [...dataChangedEventKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...dataChangedEventKeys.all, 'infinite'] as const,

  infinite: (
    filter?: DataChangedEventFilter,
    sort?: DataChangedEventSort,
    include?: DataChangedEventInclude,
  ) => [...dataChangedEventKeys.infinites(), filter, sort, include] as const,
} as const;
