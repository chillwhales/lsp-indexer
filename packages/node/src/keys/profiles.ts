import type { ProfileFilter, ProfileInclude, ProfileSort } from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * profileKeys.all              → ['profiles']
 * profileKeys.details()        → ['profiles', 'detail']
 * profileKeys.detail(addr, i)  → ['profiles', 'detail', { address, include }]
 * profileKeys.lists()          → ['profiles', 'list']
 * profileKeys.list(f,s,l,o,i)  → ['profiles', 'list', { filter, sort, limit, offset, include }]
 * profileKeys.infinites()      → ['profiles', 'infinite']
 * profileKeys.infinite(f, s, i)→ ['profiles', 'infinite', { filter, sort, include }]
 * ```
 */
export const profileKeys = {
  all: ['profiles'] as const,

  details: () => [...profileKeys.all, 'detail'] as const,

  detail: (address: string, include?: ProfileInclude) =>
    [...profileKeys.details(), { address, include }] as const,

  lists: () => [...profileKeys.all, 'list'] as const,

  list: (
    filter?: ProfileFilter,
    sort?: ProfileSort,
    limit?: number,
    offset?: number,
    include?: ProfileInclude,
  ) => [...profileKeys.lists(), { filter, sort, limit, offset, include }] as const,

  infinites: () => [...profileKeys.all, 'infinite'] as const,

  infinite: (filter?: ProfileFilter, sort?: ProfileSort, include?: ProfileInclude) =>
    [...profileKeys.infinites(), { filter, sort, include }] as const,
} as const;
