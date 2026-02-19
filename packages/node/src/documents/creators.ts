import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of LSP4 creators with total count.
 *
 * Used by both `useCreatorAddresses` (offset-based pagination) and
 * `useInfiniteCreatorAddresses` (infinite scroll).
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat CreatorFilter)
 * - `$order_by` — Sort order (built by service layer from CreatorSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `lsp4_creator_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetCreatorAddressesDocument = graphql(`
  query GetCreatorAddresses(
    $where: lsp4_creator_bool_exp
    $order_by: [lsp4_creator_order_by!]
    $limit: Int
    $offset: Int
  ) {
    lsp4_creator(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      creator_address
    }
    lsp4_creator_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
