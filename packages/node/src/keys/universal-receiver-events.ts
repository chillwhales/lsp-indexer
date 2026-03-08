import type {
  UniversalReceiverEventFilter,
  UniversalReceiverEventInclude,
  UniversalReceiverEventSort,
} from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * universalReceiverEventKeys.all                          → ['universalReceiverEvents']
 * universalReceiverEventKeys.lists()                      → ['universalReceiverEvents', 'list']
 * universalReceiverEventKeys.list(...)                    → ['universalReceiverEvents', 'list', ...]
 * universalReceiverEventKeys.infinites()                  → ['universalReceiverEvents', 'infinite']
 * universalReceiverEventKeys.infinite(...)                → ['universalReceiverEvents', 'infinite', ...]
 * ```
 */
export const universalReceiverEventKeys = {
  all: ['universalReceiverEvents'] as const,

  lists: () => [...universalReceiverEventKeys.all, 'list'] as const,

  list: (
    filter?: UniversalReceiverEventFilter,
    sort?: UniversalReceiverEventSort,
    limit?: number,
    offset?: number,
    include?: UniversalReceiverEventInclude,
  ) => [...universalReceiverEventKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...universalReceiverEventKeys.all, 'infinite'] as const,

  infinite: (
    filter?: UniversalReceiverEventFilter,
    sort?: UniversalReceiverEventSort,
    include?: UniversalReceiverEventInclude,
  ) => [...universalReceiverEventKeys.infinites(), filter, sort, include] as const,
} as const;
