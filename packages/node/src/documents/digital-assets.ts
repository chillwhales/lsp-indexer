import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single Digital Asset.
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp (e.g., `{ address: { _ilike: "0x..." } }` for case-insensitive matching)
 *
 * Fetches core LSP4 metadata fields (name, symbol, token type, total supply)
 * and aggregate counts for creators and holders (owned tokens).
 */
export const GetDigitalAssetDocument = graphql(`
  query GetDigitalAsset($where: digital_asset_bool_exp!) {
    digital_asset(where: $where, limit: 1) {
      id
      address
      lsp4TokenName {
        value
      }
      lsp4TokenSymbol {
        value
      }
      lsp4TokenType {
        value
      }
      totalSupply {
        value
      }
      lsp4Creators_aggregate {
        aggregate {
          count
        }
      }
      ownedTokens_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`);

/**
 * GraphQL document for fetching a paginated list of Digital Assets with total count.
 *
 * Used by both `useDigitalAssets` (offset-based pagination) and `useInfiniteDigitalAssets`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat DigitalAssetFilter)
 * - `$order_by` — Sort order (built by service layer from DigitalAssetSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `digital_asset_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetDigitalAssetsDocument = graphql(`
  query GetDigitalAssets(
    $where: digital_asset_bool_exp
    $order_by: [digital_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    digital_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      lsp4TokenName {
        value
      }
      lsp4TokenSymbol {
        value
      }
      lsp4TokenType {
        value
      }
      totalSupply {
        value
      }
      lsp4Creators_aggregate {
        aggregate {
          count
        }
      }
      ownedTokens_aggregate {
        aggregate {
          count
        }
      }
    }
    digital_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
