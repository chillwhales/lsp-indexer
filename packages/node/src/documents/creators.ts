import { TypedDocumentString } from '../graphql/graphql';

/**
 * GraphQL response type for the GetCreatorAddresses query.
 *
 * Manually typed (not codegen) because the `graphql()` tag only resolves
 * pre-registered queries. The shape matches the Hasura `lsp4_creator` table.
 */
export interface GetCreatorAddressesResult {
  lsp4_creator: Array<{
    address: string;
    creator_address: string;
  }>;
  lsp4_creator_aggregate: {
    aggregate: {
      count: number;
    } | null;
  };
}

/**
 * GraphQL variables for the GetCreatorAddresses query.
 */
export interface GetCreatorAddressesVariables {
  where?: Record<string, unknown>;
  order_by?: Array<Record<string, unknown>>;
  limit?: number;
  offset?: number;
}

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
export const GetCreatorAddressesDocument = new TypedDocumentString<
  GetCreatorAddressesResult,
  GetCreatorAddressesVariables
>(`
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
