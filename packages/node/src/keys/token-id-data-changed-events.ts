import type {
  TokenIdDataChangedEventFilter,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventSort,
} from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * tokenIdDataChangedEventKeys.all                   → ['tokenIdDataChangedEvents']
 * tokenIdDataChangedEventKeys.latests()             → ['tokenIdDataChangedEvents', 'latest']
 * tokenIdDataChangedEventKeys.latest(f, i)          → ['tokenIdDataChangedEvents', 'latest', { filter, include }]
 * tokenIdDataChangedEventKeys.lists()               → ['tokenIdDataChangedEvents', 'list']
 * tokenIdDataChangedEventKeys.list(...)             → ['tokenIdDataChangedEvents', 'list', ...]
 * tokenIdDataChangedEventKeys.infinites()           → ['tokenIdDataChangedEvents', 'infinite']
 * tokenIdDataChangedEventKeys.infinite(...)         → ['tokenIdDataChangedEvents', 'infinite', ...]
 * ```
 */
export const tokenIdDataChangedEventKeys = {
  all: ['tokenIdDataChangedEvents'] as const,

  latests: () => [...tokenIdDataChangedEventKeys.all, 'latest'] as const,

  latest: (filter?: TokenIdDataChangedEventFilter, include?: TokenIdDataChangedEventInclude) =>
    [...tokenIdDataChangedEventKeys.latests(), { filter, include }] as const,

  lists: () => [...tokenIdDataChangedEventKeys.all, 'list'] as const,

  list: (
    filter?: TokenIdDataChangedEventFilter,
    sort?: TokenIdDataChangedEventSort,
    limit?: number,
    offset?: number,
    include?: TokenIdDataChangedEventInclude,
  ) => [...tokenIdDataChangedEventKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...tokenIdDataChangedEventKeys.all, 'infinite'] as const,

  infinite: (
    filter?: TokenIdDataChangedEventFilter,
    sort?: TokenIdDataChangedEventSort,
    include?: TokenIdDataChangedEventInclude,
  ) => [...tokenIdDataChangedEventKeys.infinites(), filter, sort, include] as const,
} as const;
