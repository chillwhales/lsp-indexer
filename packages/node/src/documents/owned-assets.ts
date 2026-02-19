import { graphql } from '../graphql';

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
export const GetOwnedAssetsDocument = graphql(`
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
export const GetOwnedTokensDocument = graphql(`
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
