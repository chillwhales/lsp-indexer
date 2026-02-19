import type { DataChangedEvent, DataChangedFilter, DataChangedSort } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetDataChangedEventsDocument } from '../documents/data-changed';
import type { Data_Changed_Bool_Exp, Data_Changed_Order_By } from '../graphql/graphql';
import { parseDataChangedEvents } from '../parsers/data-changed';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `DataChangedFilter` to a Hasura `data_changed_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `contractAddress` → `{ address: { _ilike: contractAddress } }`
 * - `dataKey`         → `{ data_key: { _ilike: dataKey } }`
 * - `blockNumberMin`  → `{ block_number: { _gte: blockNumberMin } }`
 * - `blockNumberMax`  → `{ block_number: { _lte: blockNumberMax } }`
 */
function buildDataChangedWhere(filter?: DataChangedFilter): Data_Changed_Bool_Exp {
  if (!filter) return {};

  const conditions: Data_Changed_Bool_Exp[] = [];

  if (filter.contractAddress) {
    conditions.push({
      address: { _ilike: filter.contractAddress },
    });
  }

  if (filter.dataKey) {
    conditions.push({
      data_key: { _ilike: filter.dataKey },
    });
  }

  if (filter.blockNumberMin != null) {
    conditions.push({
      block_number: { _gte: filter.blockNumberMin },
    });
  }

  if (filter.blockNumberMax != null) {
    conditions.push({
      block_number: { _lte: filter.blockNumberMax },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `DataChangedSort` to a Hasura `order_by` array.
 *
 * Sort field → Hasura mapping:
 * - `'blockNumber'`      → `[{ block_number: direction }]`
 * - `'contractAddress'`  → `[{ address: direction }]`
 * - `'dataKey'`          → `[{ data_key: direction }]`
 */
function buildDataChangedOrderBy(sort?: DataChangedSort): Data_Changed_Order_By[] | undefined {
  if (!sort) return undefined;

  switch (sort.field) {
    case 'blockNumber':
      return [{ block_number: sort.direction }];
    case 'contractAddress':
      return [{ address: sort.direction }];
    case 'dataKey':
      return [{ data_key: sort.direction }];
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated data changed event queries.
 */
export interface FetchDataChangedEventsResult {
  /** Parsed data changed events for the current page */
  events: DataChangedEvent[];
  /** Total number of events matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of ERC725 data change events with filtering, sorting, and total count.
 *
 * Default sort is `block_number DESC` (newest events first) when no sort is provided.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed events and total count
 */
export async function fetchDataChangedEvents(
  url: string,
  params: {
    filter?: DataChangedFilter;
    sort?: DataChangedSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchDataChangedEventsResult> {
  const where = buildDataChangedWhere(params.filter);
  const orderBy = buildDataChangedOrderBy(params.sort) ?? [{ block_number: 'desc' as const }];

  const result = await execute(url, GetDataChangedEventsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    events: parseDataChangedEvents(result.data_changed),
    totalCount: result.data_changed_aggregate?.aggregate?.count ?? 0,
  };
}
