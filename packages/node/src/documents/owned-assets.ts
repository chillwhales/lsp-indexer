import { TypedDocumentString } from '../graphql/graphql';

/**
 * GraphQL response type for the GetOwnedAssets query.
 *
 * Manually typed (not codegen) because the `graphql()` tag only resolves
 * pre-registered queries. The shape matches the Hasura `owned_asset` table
 * with nested `digitalAsset` for LSP4 token name/symbol.
 */
export interface GetOwnedAssetsResult {
  owned_asset: Array<{
    owner: string;
    address: string;
    balance: string;
    digitalAsset?: {
      lsp4TokenName?: { value: string | null } | null;
      lsp4TokenSymbol?: { value: string | null } | null;
    } | null;
  }>;
  owned_asset_aggregate: {
    aggregate: {
      count: number;
    } | null;
  };
}

/**
 * GraphQL variables for the GetOwnedAssets query.
 */
export interface GetOwnedAssetsVariables {
  where?: Record<string, unknown>;
  order_by?: Array<Record<string, unknown>>;
  limit?: number;
  offset?: number;
}

/**
 * GraphQL document for fetching a paginated list of owned assets (LSP7 fungible tokens)
 * with total count.
 *
 * Used by both `useOwnedAssets` (offset-based pagination) and
 * `useInfiniteOwnedAssets` (infinite scroll).
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat OwnedAssetFilter)
 * - `$order_by` — Sort order (built by service layer from OwnedAssetSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `owned_asset_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetOwnedAssetsDocument = new TypedDocumentString<
  GetOwnedAssetsResult,
  GetOwnedAssetsVariables
>(`
  query GetOwnedAssets(
    $where: owned_asset_bool_exp
    $order_by: [owned_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    owned_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      owner
      address
      balance
      digitalAsset {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
      }
    }
    owned_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

// ---------------------------------------------------------------------------
// Owned Tokens (LSP8 NFTs with tokenId)
// ---------------------------------------------------------------------------

/**
 * GraphQL response type for the GetOwnedTokens query.
 *
 * Manually typed (not codegen) because the `graphql()` tag only resolves
 * pre-registered queries. The shape matches the Hasura `owned_token` table
 * with nested `digitalAsset` for LSP4 token name/symbol.
 */
export interface GetOwnedTokensResult {
  owned_token: Array<{
    owner: string;
    address: string;
    token_id: string;
    digitalAsset?: {
      lsp4TokenName?: { value: string | null } | null;
      lsp4TokenSymbol?: { value: string | null } | null;
    } | null;
  }>;
  owned_token_aggregate: {
    aggregate: {
      count: number;
    } | null;
  };
}

/**
 * GraphQL variables for the GetOwnedTokens query.
 */
export interface GetOwnedTokensVariables {
  where?: Record<string, unknown>;
  order_by?: Array<Record<string, unknown>>;
  limit?: number;
  offset?: number;
}

/**
 * GraphQL document for fetching a paginated list of owned tokens (LSP8 NFTs)
 * with total count.
 *
 * Used by both `useOwnedTokens` (offset-based pagination) and
 * `useInfiniteOwnedTokens` (infinite scroll).
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat OwnedTokenFilter)
 * - `$order_by` — Sort order (built by service layer from OwnedTokenSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `owned_token_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetOwnedTokensDocument = new TypedDocumentString<
  GetOwnedTokensResult,
  GetOwnedTokensVariables
>(`
  query GetOwnedTokens(
    $where: owned_token_bool_exp
    $order_by: [owned_token_order_by!]
    $limit: Int
    $offset: Int
  ) {
    owned_token(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      owner
      address
      token_id
      digitalAsset {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
      }
    }
    owned_token_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
