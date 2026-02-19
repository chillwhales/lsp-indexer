import type {
  UniversalReceiverEvent,
  UniversalReceiverFilter,
  UniversalReceiverSort,
} from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetUniversalReceiverEventsDocument } from '../documents/universal-receiver';
import type { Universal_Receiver_Bool_Exp, Universal_Receiver_Order_By } from '../graphql/graphql';
import { parseUniversalReceiverEvents } from '../parsers/universal-receiver';

// ---------------------------------------------------------------------------
// Internal builders — translate flat params to Hasura variables
// ---------------------------------------------------------------------------

/**
 * Translate a flat `UniversalReceiverFilter` to a Hasura `universal_receiver_bool_exp`.
 *
 * Multiple filters combine with `_and`. An empty or undefined filter
 * returns an empty object (no filtering).
 *
 * Filter → Hasura mapping:
 * - `receiverAddress` → `{ address: { _ilike: receiverAddress } }`
 * - `from`            → `{ from: { _ilike: from } }`
 * - `typeId`          → `{ type_id: { _ilike: typeId } }`
 * - `blockNumberMin`  → `{ block_number: { _gte: blockNumberMin } }`
 * - `blockNumberMax`  → `{ block_number: { _lte: blockNumberMax } }`
 */
function buildUniversalReceiverWhere(
  filter?: UniversalReceiverFilter,
): Universal_Receiver_Bool_Exp {
  if (!filter) return {};

  const conditions: Universal_Receiver_Bool_Exp[] = [];

  if (filter.receiverAddress) {
    conditions.push({ address: { _ilike: filter.receiverAddress } });
  }

  if (filter.from) {
    conditions.push({ from: { _ilike: filter.from } });
  }

  if (filter.typeId) {
    conditions.push({ type_id: { _ilike: filter.typeId } });
  }

  if (filter.blockNumberMin != null) {
    conditions.push({ block_number: { _gte: filter.blockNumberMin } });
  }

  if (filter.blockNumberMax != null) {
    conditions.push({ block_number: { _lte: filter.blockNumberMax } });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { _and: conditions };
}

/**
 * Translate a flat `UniversalReceiverSort` to a Hasura `order_by` array.
 *
 * **Default sort:** `block_number DESC` (newest events first) when no sort is provided.
 *
 * Sort field → Hasura mapping:
 * - `'blockNumber'`      → `[{ block_number: direction }]`
 * - `'receiverAddress'`  → `[{ address: direction }]`
 * - `'typeId'`           → `[{ type_id: direction }]`
 */
function buildUniversalReceiverOrderBy(
  sort?: UniversalReceiverSort,
): Universal_Receiver_Order_By[] {
  // Default sort: newest events first
  if (!sort) return [{ block_number: 'desc' }];

  switch (sort.field) {
    case 'blockNumber':
      return [{ block_number: sort.direction }];
    case 'receiverAddress':
      return [{ address: sort.direction }];
    case 'typeId':
      return [{ type_id: sort.direction }];
    default:
      return [{ block_number: 'desc' }];
  }
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Result shape for paginated universal receiver event queries.
 */
export interface FetchUniversalReceiverEventsResult {
  /** Parsed events for the current page */
  events: UniversalReceiverEvent[];
  /** Total number of events matching the filter (for pagination UI) */
  totalCount: number;
}

/**
 * Fetch a paginated list of Universal Receiver events with filtering, sorting, and total count.
 *
 * Translates flat filter/sort params to Hasura variables, executes the
 * query, and returns parsed results with a total count for pagination.
 *
 * @param url - The GraphQL endpoint URL
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed events and total count
 */
export async function fetchUniversalReceiverEvents(
  url: string,
  params: {
    filter?: UniversalReceiverFilter;
    sort?: UniversalReceiverSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<FetchUniversalReceiverEventsResult> {
  const where = buildUniversalReceiverWhere(params.filter);
  const orderBy = buildUniversalReceiverOrderBy(params.sort);

  const result = await execute(url, GetUniversalReceiverEventsDocument, {
    where: Object.keys(where).length > 0 ? where : undefined,
    order_by: orderBy,
    limit: params.limit,
    offset: params.offset,
  });

  return {
    events: parseUniversalReceiverEvents(result.universal_receiver),
    totalCount: result.universal_receiver_aggregate?.aggregate?.count ?? 0,
  };
}
