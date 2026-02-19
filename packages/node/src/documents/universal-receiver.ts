import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of Universal Receiver events with total count.
 *
 * Used by both `useUniversalReceiverEvents` (offset-based pagination) and
 * `useInfiniteUniversalReceiverEvents` (infinite scroll) — the difference is
 * how the hook manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from UniversalReceiverFilter)
 * - `$order_by` — Sort order (built by service layer; defaults to block_number DESC)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `universal_receiver_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetUniversalReceiverEventsDocument = graphql(`
  query GetUniversalReceiverEvents(
    $where: universal_receiver_bool_exp
    $order_by: [universal_receiver_order_by!]
    $limit: Int
    $offset: Int
  ) {
    universal_receiver(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      from
      type_id
      received_data
      returned_value
      block_number
      transaction_index
      log_index
      value
      timestamp
    }
    universal_receiver_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
