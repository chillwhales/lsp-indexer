import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single LSP29 Encrypted Asset by address.
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp
 *   (e.g., `{ address: { _ilike: "0x..." } }` for case-insensitive matching)
 *
 * Fetches core fields plus nested title, description, file info, encryption method,
 * and images.
 */
export const GetEncryptedAssetDocument = graphql(`
  query GetEncryptedAsset($where: lsp29_encrypted_asset_bool_exp!) {
    lsp29_encrypted_asset(where: $where, limit: 1) {
      id
      address
      url
      content_id
      is_data_fetched
      version
      timestamp
      universal_profile_id
      title {
        value
      }
      description {
        value
      }
      file {
        name
        type
        size
      }
      encryption {
        method
      }
      images {
        url
        width
        height
      }
      images_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`);

/**
 * GraphQL document for fetching a paginated list of LSP29 Encrypted Assets with total count.
 *
 * Used by both `useEncryptedAssets` (offset-based pagination) and
 * `useInfiniteEncryptedAssets` (infinite scroll) — the difference is how the hook
 * manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat EncryptedAssetFilter)
 * - `$order_by` — Sort order (built by service layer from EncryptedAssetSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `lsp29_encrypted_asset_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetEncryptedAssetsDocument = graphql(`
  query GetEncryptedAssets(
    $where: lsp29_encrypted_asset_bool_exp
    $order_by: [lsp29_encrypted_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    lsp29_encrypted_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      url
      content_id
      is_data_fetched
      version
      timestamp
      universal_profile_id
      title {
        value
      }
      description {
        value
      }
      file {
        name
        type
        size
      }
      encryption {
        method
      }
      images {
        url
        width
        height
      }
      images_aggregate {
        aggregate {
          count
        }
      }
    }
    lsp29_encrypted_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
