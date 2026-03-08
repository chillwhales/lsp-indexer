import type { CreatorFilter, CreatorInclude, CreatorSort } from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * creatorKeys.all                          → ['creators']
 * creatorKeys.lists()                      → ['creators', 'list']
 * creatorKeys.list(...)                    → ['creators', 'list', ...]
 * creatorKeys.infinites()                  → ['creators', 'infinite']
 * creatorKeys.infinite(...)                → ['creators', 'infinite', ...]
 * ```
 */
export const creatorKeys = {
  all: ['creators'] as const,

  lists: () => [...creatorKeys.all, 'list'] as const,

  list: (
    filter?: CreatorFilter,
    sort?: CreatorSort,
    limit?: number,
    offset?: number,
    include?: CreatorInclude,
  ) => [...creatorKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...creatorKeys.all, 'infinite'] as const,

  infinite: (filter?: CreatorFilter, sort?: CreatorSort, include?: CreatorInclude) =>
    [...creatorKeys.infinites(), filter, sort, include] as const,
} as const;
