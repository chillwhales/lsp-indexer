import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of ERC725 data change events with total count.
 *
 * Used by both `useDataChangedEvents` (offset-based pagination) and
 * `useInfiniteDataChangedEvents` (infinite scroll).
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat DataChangedFilter)
 * - `$order_by` — Sort order (built by service layer from DataChangedSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `data_changed_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetDataChangedEventsDocument = graphql(`
  query GetDataChangedEvents(
    $where: data_changed_bool_exp
    $order_by: [data_changed_order_by!]
    $limit: Int
    $offset: Int
  ) {
    data_changed(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      data_key
      data_value
      block_number
      log_index
      transaction_index
      timestamp
    }
    data_changed_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
